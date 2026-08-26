import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Clapperboard } from "lucide-react";

export type PreviewProjectItem = {
  manifestPath: string;
  title: string;
  slug: string;
  current: boolean;
};

/**
 * Header control: muted title, or a pill to switch videos when more than one
 * video.json is nearby.
 */
export function ProjectSwitcher({ title }: { title: string }) {
  const [projects, setProjects] = useState<PreviewProjectItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/__storyboard/projects");
        const payload = (await response.json()) as {
          projects?: PreviewProjectItem[];
        };
        if (cancelled) return;
        setProjects(payload.projects ?? []);
      } catch {
        if (!cancelled) setProjects([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setError(null);
      }
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openProject = async ({ manifestPath }: { manifestPath: string }) => {
    setError(null);
    setPendingPath(manifestPath);
    try {
      const response = await fetch("/__storyboard/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifestPath }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        errors?: string[];
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.errors?.join("; ") || "Could not open that video");
      }
      window.location.reload();
    } catch (err) {
      setPendingPath(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!projects || projects.length <= 1) {
    return <span>{title}</span>;
  }

  const current = projects.find((project) => project.current) ?? projects[0];

  return (
    <div className="sb-format" ref={rootRef}>
      {/* Video switcher — same pill language as the format control */}
      <button
        type="button"
        className="sb-format-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Switch video"
        onClick={() => setOpen((value) => !value)}
      >
        <Clapperboard size={14} strokeWidth={2} aria-hidden />
        <span className="sb-format-trigger-label">{current.title}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div className="sb-menu sb-menu-left" role="menu">
          <h3>Videos</h3>
          {projects.map((project) => (
            <button
              key={project.manifestPath}
              type="button"
              className="sb-menu-item"
              role="menuitemradio"
              aria-checked={project.current}
              disabled={pendingPath != null}
              onClick={() => {
                if (project.current) {
                  setOpen(false);
                  return;
                }
                void openProject({ manifestPath: project.manifestPath });
              }}
            >
              <Clapperboard size={16} aria-hidden />
              <span style={{ flex: 1 }}>
                {project.title}
                <small>{project.slug}</small>
              </span>
              {project.current ? <Check size={16} aria-hidden /> : null}
            </button>
          ))}
          {error ? <p className="sb-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
