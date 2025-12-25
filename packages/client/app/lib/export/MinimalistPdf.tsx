import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeProfile } from "@app/shared";
import { formatDateRange, formatGraduationDate } from "./date-formatters";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.35,
    color: "#111",
  },
  header: {
    borderBottom: "2 solid #6246ea",
    paddingBottom: 6,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 10,
    color: "#444",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    color: "#555",
    fontSize: 9,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#6246ea",
    borderBottom: "1 solid #ddd",
    paddingBottom: 2,
    marginBottom: 6,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 10.5,
    fontWeight: 700,
  },
  jobCompany: {
    fontSize: 9.5,
    color: "#444",
  },
  dateText: {
    fontSize: 9,
    color: "#555",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bullet: {
    width: 6,
    fontSize: 10,
    lineHeight: 1.35,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: "#222",
  },
  skillGroup: {
    marginBottom: 4,
  },
  skillName: {
    fontSize: 9.5,
    fontWeight: 700,
    marginBottom: 1,
  },
  textSmall: {
    fontSize: 9,
    color: "#444",
  },
});


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
            {education.map((edu, idx) => {
              const degreeText = `${edu.studyType}${edu.area ? ` in ${edu.area}` : ""}`;
              const graduationDate = formatGraduationDate(edu.endDate);
              
              return (
                <View key={`${edu.institution}-${idx}`} style={{ marginBottom: 6 }}>
                  <Text style={styles.jobTitle}>{edu.institution}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 1 }}>
                    <Text style={styles.textSmall}>{degreeText}</Text>
                    {graduationDate ? <Text style={styles.textSmall}>{graduationDate}</Text> : null}
                  </View>
                </View>
              );
            })}
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
                    {formatDateRange(job.startDate, job.endDate)}
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

