"use client";

import { useState, useEffect } from "react";

interface TocItem {
  id: string;
  title: string;
  level: number;
  number: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    // Track which elements are intersecting
    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        // Sort visible headings by their position in viewport
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);

        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0].target.id);
        } else {
          // If none are visible (e.g. scrolled past them), we can find the one closest to the top of the viewport
          const scrollPosition = window.scrollY + 100;
          let currentHeading = items[0]?.id;
          
          for (const el of headingElements) {
            if (el.offsetTop <= scrollPosition) {
              currentHeading = el.id;
            } else {
              break;
            }
          }
          setActiveId(currentHeading);
        }
      },
      {
        rootMargin: "-60px 0px -70% 0px",
        threshold: [0, 1.0],
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    // Fallback scroll listener for smooth and accurate tracking
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      let currentHeading = items[0]?.id;

      for (const el of headingElements) {
        if (el.offsetTop <= scrollPosition) {
          currentHeading = el.id;
        } else {
          break;
        }
      }
      setActiveId(currentHeading);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  const handleClick = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // offset for smooth alignment
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="sticky top-24">
      <h4 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase mb-3.5">
        Table of contents
      </h4>
      <nav className="flex flex-col gap-2.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
            className={`block w-full text-left text-[13px] leading-tight transition-all duration-150 ${
              activeId === item.id
                ? "text-primary font-semibold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            {item.number}. {item.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
