import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Section from '@/components/Section';
import ContactCTA from '@/components/ContactCTA';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { getProjectBySlug, getProjectById, renderNotionBlocks } from '@/services/notion';

type PageProps = {
  params: { slug: string | string[] };
};

function normalizeNotionId(input: string): string | null {
  // 36-char UUID with dashes
  const dashed = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (dashed.test(input)) return input;
  // 32-char UUID without dashes
  const plain = /^[0-9a-fA-F]{32}$/;
  if (plain.test(input)) {
    return `${input.slice(0,8)}-${input.slice(8,12)}-${input.slice(12,16)}-${input.slice(16,20)}-${input.slice(20)}`;
  }
  return null;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  // 优先通过 slug + 语言精确查询；若失败则按 id 回退
  let project = await getProjectBySlug(slugParam, { language: 'English' });
  if (!project) {
    const normalizedId = normalizeNotionId(slugParam);
    if (normalizedId) {
      project = await getProjectById(normalizedId);
    }
  }
  if (!project) {
    notFound();
  }

  return (
    <>
      {/* Hero Section */}
      <Section id="project-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:gap-12 items-center">
            <div className="w-full md:w-1/2 mb-8 md:mb-0">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
                {project.title}
              </h1>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-6">
                {project.subtitle || project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(project.technologies || []).map((tech: string) => (
                  <span
                    key={tech}
                    className="inline-block py-1 px-3 rounded-full text-sm font-medium bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 mb-6">
                {project.projectUrl && (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 transition"
                  >
                    <FontAwesomeIcon icon={faLink} className="w-4 h-4" />
                    <span>Live Project</span>
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 px-4 rounded-lg bg-neutral-light dark:bg-dark-neutral-light text-neutral-darker dark:text-dark-neutral-darker font-medium hover:opacity-90 transition"
                  >
                    <FontAwesomeIcon icon={faGithub} className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Project Description */}
      <Section id="project-description">
        <div className="container mx-auto">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              Project Overview
            </h2>
            <p className="text-neutral-dark dark:text-dark-neutral-dark mb-6">
              {project.description}
            </p>

            {Array.isArray((project as any).content) && (project as any).content.length > 0 && (
              <div
                className="notion-content mt-8"
                dangerouslySetInnerHTML={{ __html: renderNotionBlocks((project as any).content) }}
              />
            )}

            <div className="my-12">
              <Link
                href="/projects"
                className="flex items-center gap-2 text-primary dark:text-dark-primary font-medium hover:underline"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                <span>Back to Projects</span>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <ContactCTA />
    </>
  );
}