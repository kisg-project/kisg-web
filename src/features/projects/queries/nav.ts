import "server-only";
import { PROJECTS_PATH } from "@/config/nav";
import { getPublishedProjects } from "./public";

/** Tujuan menu "Proyek": detail kalau hanya satu proyek terbit, daftar kalau lebih dari satu. */
export async function getProjectsHref(): Promise<string> {
  const projects = await getPublishedProjects();
  const [only] = projects;
  return projects.length === 1 && only ? `${PROJECTS_PATH}/${only.slug}` : PROJECTS_PATH;
}
