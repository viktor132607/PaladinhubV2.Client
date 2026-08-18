"use client";

import { useEffect } from "react";

const ALERT_SELECTOR = ".alert-custom, .alert-floating";
const DISMISS_AFTER_MS = 3500;

export default function AutoDismissAlerts() {
  useEffect(() => {
    const timers = new Map<Element, ReturnType<typeof setTimeout>>();

    const schedule = (element: Element) => {
      if (timers.has(element)) {
        return;
      }

      const timer = setTimeout(() => {
        element.classList.remove("show");
        element.remove();
        timers.delete(element);
      }, DISMISS_AFTER_MS);

      timers.set(element, timer);
    };

    document.querySelectorAll(ALERT_SELECTOR).forEach(schedule);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches(ALERT_SELECTOR)) {
            schedule(node);
          }

          node.querySelectorAll(ALERT_SELECTOR).forEach(schedule);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return null;
}
