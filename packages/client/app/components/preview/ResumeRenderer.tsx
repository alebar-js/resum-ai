import type { ResumeProfile } from "@app/shared";

interface ResumeRendererProps {
  data: ResumeProfile;
}

export function ResumeRenderer({ data }: ResumeRendererProps) {
  return (
    <div className="resume-container p-8 max-w-4xl mx-auto bg-background text-foreground">
      {/* Header */}
      <header className="mb-8 border-b-2 border-purple-600 pb-4">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">
          {data.basics.name || "Your Name"}
        </h1>
        {data.basics.label && (
          <p className="text-xl text-muted-foreground mb-2">{data.basics.label}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {data.basics.email && <span>{data.basics.email}</span>}
          {data.basics.phone && <span>{data.basics.phone}</span>}
          {data.basics.url && (
            <a href={data.basics.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
              {data.basics.url}
            </a>
          )}
          {data.basics.location && data.basics.location.city && (
            <span>{data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ""}</span>
          )}
        </div>
      </header>

      {/* Work Experience */}
      {data.work && data.work.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-purple-600 mb-3 border-b border-gray-300 pb-1">
            Work Experience
          </h2>
          <div className="space-y-6">
            {data.work.map((job) => (
              <div key={job.id} className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{job.position}</h3>
                    <p className="text-lg text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <span>{job.startDate}</span>
                    {job.endDate ? (
                      <span> - {job.endDate}</span>
                    ) : (
                      <span> - Present</span>
                    )}
                  </div>
                </div>
                {job.highlights && job.highlights.length > 0 && (
                  <ul className="list-disc list-inside ml-4 space-y-1 text-foreground">
                    {job.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-purple-600 mb-3 border-b border-gray-300 pb-1">
            Skills
          </h2>
          <div className="space-y-3">
            {data.skills.map((skill, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-foreground mb-1">{skill.name}</h3>
                <p className="text-muted-foreground">{skill.keywords.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-purple-600 mb-3 border-b border-gray-300 pb-1">
            Education
          </h2>
          <div className="space-y-4">
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{edu.institution}</h3>
                    <p className="text-muted-foreground">{edu.studyType} in {edu.area}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <span>{edu.startDate}</span>
                    {edu.endDate && <span> - {edu.endDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-purple-600 mb-3 border-b border-gray-300 pb-1">
            Projects
          </h2>
          <div className="space-y-4">
            {data.projects
              .filter((project): project is NonNullable<typeof project> => project != null)
              .map((project, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {project.url ? (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        {project.name}
                      </a>
                    ) : (
                      project.name
                    )}
                  </h3>
                </div>
                {project.description && (
                  <p className="text-muted-foreground mb-2">{project.description}</p>
                )}
                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="list-disc list-inside ml-4 space-y-1 text-foreground">
                      {project.highlights.map((highlight, hIdx) => (
                        <li key={hIdx}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

