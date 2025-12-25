import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeProfile } from "@app/shared";

/**
 * Generate a simple DOCX resume using a minimalist layout.
 * Returns a Blob that can be downloaded by the caller.
 */
export async function generateDocx(resume: ResumeProfile): Promise<Blob> {
  const { basics, work, skills, education, projects } = resume;

  const contactParts = [
    basics.email,
    basics.phone,
    basics.url,
    basics.location?.city
      ? `${basics.location.city}${basics.location.region ? `, ${basics.location.region}` : ""}`
      : undefined,
  ].filter(Boolean);

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: basics.name || "Your Name",
      heading: HeadingLevel.TITLE,
    })
  );

  if (basics.label) {
    children.push(
      new Paragraph({
        text: basics.label,
        heading: HeadingLevel.HEADING_2,
      })
    );
  }

  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun(contactParts.join("  •  "))],
      })
    );
  }

  if (work?.length) {
    children.push(
      new Paragraph({
        text: "Work Experience",
        heading: HeadingLevel.HEADING_2,
      })
    );

    work.forEach((job) => {
      children.push(
        new Paragraph({
          text: `${job.position} — ${job.company}`,
          heading: HeadingLevel.HEADING_3,
        })
      );

      children.push(
        new Paragraph({
          text: `${job.startDate || ""} – ${job.endDate || "Present"}`,
        })
      );

      (job.highlights || []).forEach((h) =>
        children.push(
          new Paragraph({
            text: h,
            bullet: { level: 0 },
          })
        )
      );
    });
  }

  if (skills?.length) {
    children.push(
      new Paragraph({
        text: "Skills",
        heading: HeadingLevel.HEADING_2,
      })
    );

    skills.forEach((skill) =>
      children.push(
        new Paragraph({
          text: `${skill.name}: ${skill.keywords.join(", ")}`,
        })
      )
    );
  }

  if (education?.length) {
    children.push(
      new Paragraph({
        text: "Education",
        heading: HeadingLevel.HEADING_2,
      })
    );

    education.forEach((edu) => {
      children.push(
        new Paragraph({
          text: `${edu.institution} — ${edu.studyType} in ${edu.area}`,
          heading: HeadingLevel.HEADING_3,
        })
      );

      children.push(
        new Paragraph({
          text: `${edu.startDate || ""} – ${edu.endDate || "Present"}`,
        })
      );
    });
  }

  if (projects?.length) {
    children.push(
      new Paragraph({
        text: "Projects",
        heading: HeadingLevel.HEADING_2,
      })
    );

    projects
      .filter((proj): proj is NonNullable<typeof proj> => Boolean(proj))
      .forEach((project) => {
        children.push(
          new Paragraph({
            text: project.name,
            heading: HeadingLevel.HEADING_3,
          })
        );

        if (project.description) {
          children.push(
            new Paragraph({
              text: project.description,
            })
          );
        }

        (project.highlights || []).forEach((h) =>
          children.push(
            new Paragraph({
              text: h,
              bullet: { level: 0 },
            })
          )
        );
      });
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

