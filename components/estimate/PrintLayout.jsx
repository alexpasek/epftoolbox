import Image from "next/image";

function splitDescription(desc = "") {
  const lines = (desc || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length)
    return {
      title: "",
      bullets: [],
    };
  const [title, ...rest] = lines;
  const bullets = rest.map((line) => line.replace(/^•\s*/i, ""));
  return { title, bullets };
}

const DEFAULT_BRAND = {
  name: "EPF Pro Services",
  tagline: "Popcorn ceiling & interior finishing specialists",
  contactLine: "info@epfproservices.com • 647-923-6784 • epfproservices.com",
  logoSrc: "/logo/image.png",
  logoAlt: "EPF logo",
  legalLine: "",
  brandColor: "#f97316",
  footerLines: [
    "EPF Pro Services • 647-923-6784 • info@epfproservices.com • epfproservices.com",
  ],
};

const currency = (val) =>
  `$${Math.round(Number(val || 0)).toLocaleString("en-CA")}`;

export default function PrintLayout({
  snapshot,
  previewVisible,
  onClosePreview,
  brandProfile,
}) {
  if (!snapshot) return null;

  const {
    client,
    contact,
    site,
    date,
    quoteId,
    preparedBy,
    startWindow,
    items = [],
    sections = [],
    notes,
    totals = {},
  } = snapshot;

  const brand = brandProfile || DEFAULT_BRAND;
  const className = `print-estimate${previewVisible ? " show" : ""}`;
  const infoCards = [
    {
      label: "Client",
      value: client || "[Client name]",
      helper: contact,
    },
    {
      label: "Project Site",
      value: site || "[Project address]",
    },
    {
      label: "Prepared By",
      value: preparedBy || brand.name,
      helper: startWindow ? `Start window: ${startWindow}` : "Start window TBD",
    },
  ];

  return (
    <div className={className}>
      <div className="print-page">
        {previewVisible ? (
          <button
            type="button"
            className="preview-close"
            onClick={onClosePreview}
          >
            Close preview
          </button>
        ) : null}
        <header className="print-hero">
          <div className="hero-brand">
            <div
              className="logo-wrap"
              style={
                brand.brandColor
                  ? { borderColor: brand.brandColor }
                  : undefined
              }
            >
              <Image
                src={brand.logoSrc || DEFAULT_BRAND.logoSrc}
                alt={brand.logoAlt || DEFAULT_BRAND.logoAlt}
                width={60}
                height={60}
                priority={false}
              />
            </div>
            <div className="hero-text">
              <h1>{brand.name || DEFAULT_BRAND.name}</h1>
              <p>{brand.tagline || DEFAULT_BRAND.tagline}</p>
              <span>{brand.contactLine || DEFAULT_BRAND.contactLine}</span>
              {brand.legalLine ? (
                <small className="brand-legal">{brand.legalLine}</small>
              ) : null}
            </div>
          </div>
          <div className="hero-summary">
            <span>Estimate Total</span>
            <strong>{currency(totals.total)}</strong>
            <p>Quote {quoteId || "EPF-QUOTE"}</p>
            <small>Issued {date || new Date().toISOString().slice(0, 10)}</small>
          </div>
        </header>

        <section className="print-info-grid">
          {infoCards.map((card) => (
            <article key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.helper ? <p>{card.helper}</p> : null}
            </article>
          ))}
        </section>

        <section className="scope-table">
          {sections.length ? (
            sections.map((section, sIdx) => (
              <article key={`${section.title}-${sIdx}`} className="scope-card">
                <header>
                  <h3>{section.title || "Service Section"}</h3>
                  <span>
                    {currency(
                      section.items.reduce(
                        (sum, item) => sum + (item.amount || 0),
                        0
                      )
                    )}
                  </span>
                </header>
                <table>
                  <tbody>
                    {section.items.map((item, idx) => {
                      const { title, bullets } = splitDescription(
                        item.description || ""
                      );
                      return (
                        <tr key={`${item.description}-${idx}`}>
                          <td>
                            <div className="line-title">
                              {title || item.description || "Service line"}
                            </div>
                            {bullets.length ? (
                              <ul>
                                {bullets.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet}</li>
                                ))}
                              </ul>
                            ) : null}
                          </td>
                          <td className="line-amount">
                            {currency(item.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
            ))
          ) : (
            <table>
              <tbody>
                {items.map((item, idx) => {
                  const { title, bullets } = splitDescription(
                    item.description || ""
                  );
                  return (
                    <tr key={`${item.description}-${idx}`}>
                      <td>
                        <div className="line-title">
                          {title || item.description || "Service line"}
                        </div>
                        {bullets.length ? (
                          <ul>
                            {bullets.map((bullet, bIdx) => (
                              <li key={bIdx}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="line-amount">{currency(item.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {notes ? (
          <section className="print-notes">
            <h4>Scope notes</h4>
            <p>{notes}</p>
          </section>
        ) : null}

        <section className="print-totals">
          <article>
            <span>Labour</span>
            <strong>{currency(totals.labour)}</strong>
          </article>
          <article>
            <span>Materials</span>
            <strong>{currency(totals.materials)}</strong>
          </article>
          <article>
            <span>Tax</span>
            <strong>{currency(totals.tax)}</strong>
          </article>
          <article className="grand">
            <span>Total</span>
            <strong>{currency(totals.total)}</strong>
          </article>
        </section>

        <footer className="print-footer">
          {Array.isArray(brand.footerLines) && brand.footerLines.length
            ? brand.footerLines.map((line, idx) => <p key={idx}>{line}</p>)
            : DEFAULT_BRAND.footerLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
        </footer>
      </div>
    </div>
  );
}
