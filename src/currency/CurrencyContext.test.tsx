import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CurrencyProvider, useCurrency } from "./CurrencyContext";

function Price() {
  const { currency, usdPerEur, formatMoney } = useCurrency();
  return <span data-currency={currency} data-rate={usdPerEur ?? "unavailable"}>{formatMoney(34.99)}</span>;
}

describe("currency before the exchange rate loads", () => {
  it("defaults to EUR without inventing a USD rate", () => {
    const markup = renderToStaticMarkup(<CurrencyProvider><Price /></CurrencyProvider>);
    expect(markup).toContain('data-currency="EUR"');
    expect(markup).toContain('data-rate="unavailable"');
    expect(markup).toContain("€");
  });
});
