import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeProfile } from "@app/shared";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#111",
  },
  header: {
    borderBottom: "2 solid #6246ea",
    paddingBottom: 8,
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 12,
    color: "#444",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    color: "#555",
    fontSize: 10,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#6246ea",
    borderBottom: "1 solid #ddd",
    paddingBottom: 4,
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 11.5,
    fontWeight: 700,
  },
  jobCompany: {
    fontSize: 10.5,
    color: "#444",
  },
  dateText: {
    fontSize: 10,
    color: "#555",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 8,
    fontSize: 12,
    lineHeight: 1.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    color: "#222",
  },
  skillGroup: {
    marginBottom: 6,
  },
  skillName: {
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 2,
  },
  textSmall: {
    fontSize: 10,
    color: "#444",
  },
});

const formatDate = (value?: string | null) => {
  if (!value) return "Present";
  return value;
};

interface MinimalistPdfProps {
  resume: ResumeProfile;
}

/**
 * Minimalist (Harvard-style) PDF template.
 * Accepts ResumeProfile JSON and renders a single-column PDF layout.
 */
export function MinimalistPdf({ resume }: MinimalistPdfProps) {
  const { basics, work, skills, education, projects } = resume;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{basics.name || "Your Name"}</Text>
          {basics.label ? <Text style={styles.label}>{basics.label}</Text> : null}
          <View style={styles.contactRow}>
            {basics.email ? <Text>{basics.email}</Text> : null}
            {basics.phone ? <Text>• {basics.phone}</Text> : null}
            {basics.url ? <Text>• {basics.url}</Text> : null}
            {basics.location?.city ? (
              <Text>
                • {basics.location.city}
                {basics.location.region ? `, ${basics.location.region}` : ""}
              </Text>
            ) : null}
          </View>
        </View>
        {/* Education */}
        {education?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, idx) => (
              <View key={`${edu.institution}-${idx}`} style={{ marginBottom: 6 }}>
                <Text style={styles.jobTitle}>{edu.institution}</Text>
                <Text style={styles.textSmall}>
                  {edu.studyType} in {edu.area}
                </Text>
                <Text style={styles.textSmall}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Work Experience */}
        {work?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {work.map((job) => (
              <View key={job.id} wrap={false} style={{ marginBottom: 8 }}>
                <View style={styles.jobHeader}>
                  <View>
                    <Text style={styles.jobTitle}>{job.position}</Text>
                    <Text style={styles.jobCompany}>{job.company}</Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDate(job.startDate)} – {formatDate(job.endDate)}
                  </Text>
                </View>
                {job.highlights?.map((highlight, idx) => (
                  <View key={`${job.id}-${idx}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {projects?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects
              .filter((proj): proj is NonNullable<typeof proj> => Boolean(proj))
              .map((project, idx) => (
                <View key={`${project.name}-${idx}`} style={{ marginBottom: 6 }}>
                  <Text style={styles.jobTitle}>{project.name}</Text>
                  {project.description ? (
                    <Text style={styles.textSmall}>{project.description}</Text>
                  ) : null}
                  {project.highlights?.map((highlight, hIdx) => (
                    <View key={`${project.name}-${hIdx}`} style={styles.bulletRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        ) : null}

        {/* Skills */}
        {skills?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skills.map((skill, idx) => (
              <View key={`${skill.name}-${idx}`} style={styles.skillGroup}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.textSmall}>{skill.keywords.join(", ")}</Text>
              </View>
            ))}
          </View>
        ) : null}

      </Page>
    </Document>
  );
}

