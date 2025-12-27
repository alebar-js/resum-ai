import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderKanban,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import {
  useDeleteJobPosting,
  useDeleteJobPostingFolder,
  useUpdateJobPostingData,
} from "~/lib/queries";
import type { JobPostingData } from "~/lib/api";

interface FolderTreeProps {
  jobPostings: JobPostingData[];
  activeJobPostingId?: string | null;
  searchQuery?: string;
  onItemClick?: (jobPosting: JobPostingData) => void;
  createFolderTrigger?: number;
  onFoldersChange?: (folders: Set<string>) => void;
}

type FolderPath = `/${string}`;

function normalizeFolderPath(path: string | null | undefined): FolderPath | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return null;

  const cleaned = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  const firstSegment = cleaned.split("/").filter(Boolean)[0];
  if (!firstSegment) return null;

  return `/${firstSegment}` as FolderPath;
}

function folderNameFromPath(path: FolderPath): string {
  return path.slice(1);
}

function CreateFolderInput({
  onCreateFolder,
  onCancel,
}: {
  onCreateFolder: (folderName: string) => void;
  onCancel: () => void;
}) {
  const [folderName, setFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const trimmed = folderName.trim();
    if (!trimmed || trimmed.includes("/")) {
      onCancel();
      return;
    }
    onCreateFolder(trimmed);
  };

  return (
    <div className="px-3 py-1.5">
      <Input
        ref={inputRef}
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={submit}
        placeholder="Folder name..."
        className="h-7 text-sm"
      />
    </div>
  );
}

function RenameInput({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onCommit(trimmed);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={submit}
      className="h-5 text-sm"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function JobPostingRow({
  item,
  isActive,
  isRenaming,
  onClick,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
}: {
  item: JobPostingData;
  isActive: boolean;
  isRenaming: boolean;
  onClick: () => void;
  onStartRename: () => void;
  onCommitRename: (newTitle: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={() => !isRenaming && onClick()}
      className={cn(
        "group flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors cursor-pointer",
        isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/30"
      )}
    >
      <FolderKanban className="w-4 h-4 text-muted-foreground flex-shrink-0" />

      {isRenaming ? (
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <RenameInput
            initialValue={item.title || ""}
            onCommit={onCommitRename}
            onCancel={onCancelRename}
          />
        </div>
      ) : (
        <span className="text-sm truncate flex-1 min-w-0">{item.title || "(Untitled)"}</span>
      )}

      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex-shrink-0 p-1 rounded hover:bg-accent/50 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="Job posting actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStartRename();
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function FolderTree({
  jobPostings,
  activeJobPostingId,
  searchQuery,
  onItemClick,
  createFolderTrigger,
  onFoldersChange,
}: FolderTreeProps) {
  const navigate = useNavigate();

  const updateJobPostingMutation = useUpdateJobPostingData();
  const deleteJobPostingMutation = useDeleteJobPosting();
  const deleteFolderMutation = useDeleteJobPostingFolder();

  const [expandedFolders, setExpandedFolders] = useState<Set<FolderPath>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [renamingFolderPath, setRenamingFolderPath] = useState<FolderPath | null>(null);
  const [renamingJobPostingId, setRenamingJobPostingId] = useState<string | null>(null);

  // Client-side only folders (one level deep; stored as "/name")
  const [clientFolders, setClientFolders] = useState<Set<FolderPath>>(new Set());

  useEffect(() => {
    if (createFolderTrigger && createFolderTrigger > 0) {
      setIsCreatingFolder(true);
    }
  }, [createFolderTrigger]);

  const q = (searchQuery ?? "").trim().toLowerCase();
  const matches = (p: JobPostingData) => (q ? p.title.toLowerCase().includes(q) : true);

  const model = useMemo(() => {
    const rootItems: JobPostingData[] = [];
    const foldersMap = new Map<FolderPath, JobPostingData[]>();

    for (const posting of jobPostings) {
      const folderPath = normalizeFolderPath(posting.path);
      if (!folderPath) {
        rootItems.push(posting);
        continue;
      }
      const list = foldersMap.get(folderPath) ?? [];
      list.push(posting);
      foldersMap.set(folderPath, list);
    }

    // Merge in client folders (empty folders live only client-side)
    for (const folderPath of clientFolders) {
      if (!foldersMap.has(folderPath)) foldersMap.set(folderPath, []);
    }

    const folders = Array.from(foldersMap.entries())
      .map(([path, items]) => ({
        path,
        name: folderNameFromPath(path),
        items,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { rootItems, folders };
  }, [jobPostings, clientFolders]);

  const filteredRootItems = model.rootItems.filter(matches);
  const filteredFolders = model.folders
    .map((f) => ({
      ...f,
      items: f.items.filter(matches),
    }))
    .filter((f) => {
      if (!q) return true;
      return f.items.length > 0 || f.name.toLowerCase().includes(q);
    });

  const toggleFolder = (path: FolderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openJobPosting = (posting: JobPostingData) => {
    if (onItemClick) onItemClick(posting);
    else navigate(`/job-posting/${posting.id}`);
  };

  const createFolder = (name: string) => {
    if (!name.trim() || name.includes("/")) return;
    const folderPath = `/${name.trim()}` as FolderPath;

    setClientFolders((prev) => {
      const next = new Set(prev);
      next.add(folderPath);
      onFoldersChange?.(next);
      return next;
    });

    setIsCreatingFolder(false);
    setExpandedFolders((prev) => new Set(prev).add(folderPath));
  };

  const deleteFolder = async (folderPath: FolderPath, hasAnyItems: boolean) => {
    // If the active posting is inside this folder, navigate away to avoid stale URL/content.
    if (activeJobPostingId) {
      const active = jobPostings.find((p) => p.id === activeJobPostingId);
      if (active && normalizeFolderPath(active.path) === folderPath) {
        navigate("/job-postings");
      }
    }

    // Always remove from client folder state
    setClientFolders((prev) => {
      const next = new Set(prev);
      next.delete(folderPath);
      onFoldersChange?.(next);
      return next;
    });

    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.delete(folderPath);
      return next;
    });

    // If there are persisted postings, delete them via API (and subfolders, though we don't allow them)
    if (hasAnyItems) {
      await deleteFolderMutation.mutateAsync(folderPath.slice(1));
    }
  };

  const renameFolder = async (oldPath: FolderPath, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.includes("/")) {
      setRenamingFolderPath(null);
      return;
    }
    const newPath = `/${trimmed}` as FolderPath;
    if (newPath === oldPath) {
      setRenamingFolderPath(null);
      return;
    }

    // Update all postings that belong to this folder (one-level depth)
    const postingsInFolder = jobPostings.filter(
      (p) => normalizeFolderPath(p.path) === oldPath
    );
    for (const posting of postingsInFolder) {
      await updateJobPostingMutation.mutateAsync({
        id: posting.id,
        data: { path: newPath },
      });
    }

    // Update client folder state
    setClientFolders((prev) => {
      const next = new Set(prev);
      if (next.has(oldPath)) next.delete(oldPath);
      next.add(newPath);
      onFoldersChange?.(next);
      return next;
    });

    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(oldPath)) next.delete(oldPath);
      next.add(newPath);
      return next;
    });

    setRenamingFolderPath(null);
  };

  const deleteJobPosting = async (id: string) => {
    await deleteJobPostingMutation.mutateAsync(id);
    if (id === activeJobPostingId) {
      navigate("/job-postings");
    }
  };

  const commitRenameJobPosting = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setRenamingJobPostingId(null);
      return;
    }
    await updateJobPostingMutation.mutateAsync({ id, data: { title: trimmed } });
    setRenamingJobPostingId(null);
  };

  return (
    <div className="space-y-1">
      {/* Root job postings */}
      {filteredRootItems.map((item) => (
        <JobPostingRow
          key={item.id}
          item={item}
          isActive={activeJobPostingId === item.id}
          isRenaming={renamingJobPostingId === item.id}
          onClick={() => openJobPosting(item)}
          onStartRename={() => setRenamingJobPostingId(item.id)}
          onCommitRename={(t) => commitRenameJobPosting(item.id, t)}
          onCancelRename={() => setRenamingJobPostingId(null)}
          onDelete={() => deleteJobPosting(item.id)}
        />
      ))}

      {/* Create folder row (root only) */}
      {isCreatingFolder && (
        <CreateFolderInput
          onCreateFolder={createFolder}
          onCancel={() => setIsCreatingFolder(false)}
        />
      )}

      {/* One-level folders */}
      {filteredFolders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.path);
        const itemCount = folder.items.length;
        const isRenaming = renamingFolderPath === folder.path;
        const hasAnyItems = (model.folders.find((f) => f.path === folder.path)?.items.length ?? 0) > 0;

        return (
          <Collapsible
            key={folder.path}
            open={isExpanded}
            onOpenChange={() => toggleFolder(folder.path)}
          >
            <div className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent/30 transition-colors">
              <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {isRenaming ? (
                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <RenameInput
                      initialValue={folder.name}
                      onCommit={(v) => renameFolder(folder.path, v)}
                      onCancel={() => setRenamingFolderPath(null)}
                    />
                  </div>
                ) : (
                  <span className="text-sm font-medium truncate">{folder.name}</span>
                )}
              </CollapsibleTrigger>

              {itemCount > 0 && (
                <span className="text-xs text-muted-foreground flex-shrink-0">{itemCount}</span>
              )}

              {!isRenaming && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex-shrink-0 p-1 rounded hover:bg-accent/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Folder actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFolderPath(folder.path);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteFolder(folder.path, hasAnyItems);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <CollapsibleContent>
              <div className="ml-4 space-y-1">
                {folder.items.map((item) => (
                  <JobPostingRow
                    key={item.id}
                    item={item}
                    isActive={activeJobPostingId === item.id}
                    isRenaming={renamingJobPostingId === item.id}
                    onClick={() => openJobPosting(item)}
                    onStartRename={() => setRenamingJobPostingId(item.id)}
                    onCommitRename={(t) => commitRenameJobPosting(item.id, t)}
                    onCancelRename={() => setRenamingJobPostingId(null)}
                    onDelete={() => deleteJobPosting(item.id)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}


