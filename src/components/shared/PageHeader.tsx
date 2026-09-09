"use client";

import { useState } from "react";

export type PageHeaderButton = {
  text: string;
  url: string;
  icon?: string;
};

export type PageHeaderProps = {
  coverImage?: string;
  title?: string;
  text?: string;
  currentSections?: PageHeaderButton[];
  otherSections?: PageHeaderButton[];
  canEdit?: boolean;
};

function SectionButtons({
  title,
  buttons,
}: {
  title: string;
  buttons?: PageHeaderButton[];
}) {
  if (!buttons?.length) return null;

  return (
    <>
      <div
        className="section-title"
        style={{ fontSize: "1.8em", textAlign: "center", color: "white" }}
      >
        {title} :
      </div>
      <div className="section-grid">
        {buttons.map((button) => (
          <a
            key={`${button.url}-${button.text}`}
            href={button.url}
            className="section-cell"
          >
            {button.icon ? (
              <span
                className="icon"
                style={{ backgroundImage: `url('${button.icon}')` }}
              />
            ) : null}
            <span>{button.text}</span>
          </a>
        ))}
      </div>
    </>
  );
}

export default function PageHeader({
  coverImage,
  title,
  text,
  currentSections,
  otherSections,
  canEdit = false,
}: PageHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="outer-wrapper ph-guide-page-header">
      <div className="page-container">
        {coverImage ? (
          <div className="image-cover-container">
            <img src={coverImage} alt="Cover" className="image-cover" />
          </div>
        ) : null}

        <div className="main-wrapper ph-guide-page-header-body">
          {canEdit ? (
            <>
              <div
                className="position-fixed"
                style={{ left: 80, bottom: 80, zIndex: 1050 }}
              >
                <button
                  id="btnEditPopup"
                  type="button"
                  className="btn btn-warning btn-todo-hover"
                  onClick={() => setEditOpen(true)}
                >
                  <i className="fa fa-pen me-1" />Edit Page
                </button>
              </div>

              {editOpen ? (
                <div
                  className="edit-overlay"
                  style={{ display: "flex" }}
                  aria-hidden="false"
                  onClick={() => setEditOpen(false)}
                >
                  <span className="edit-close">×</span>
                  <img
                    src="/images/WorkInProgress.jpg"
                    alt="Work in progress"
                    onClick={(event) => event.stopPropagation()}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          <br />

          {title ? <h1 className="page-title">{title}</h1> : null}
          {text ? <p className="page-text">{text}</p> : null}

          <SectionButtons title="Current Sections" buttons={currentSections} />
          <SectionButtons title="Other Sections" buttons={otherSections} />

          <div className="separator-container">
            <img
              src="/images/Separators/D4.png"
              alt="Separator 4"
              className="separator"
            />
          </div>
          <br />
        </div>
      </div>
    </div>
  );
}
