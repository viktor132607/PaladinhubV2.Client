"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
export default function AuthenticatorQr({ uri }: { uri: string }) {
  const [image, setImage] = useState("");
  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(uri, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((value) => {
        if (active) setImage(value);
      })
      .catch(() => {
        if (active) setImage("");
      });
    return () => {
      active = false;
    };
  }, [uri]);
  return image ? (
    <img
      src={image}
      width={220}
      height={220}
      alt="Scan this QR code with your authenticator app"
    />
  ) : null;
}
