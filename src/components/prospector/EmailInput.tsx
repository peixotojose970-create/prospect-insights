import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useProspector } from "@/features/prospector/store";

/**
 * Campo de e-mail editável do lead. A Places API não retorna e-mail,
 * então ele é preenchido manualmente e salvo junto com o lead.
 */
export function EmailInput({
  id,
  name,
  email,
  className,
}: {
  id: string;
  name: string;
  email?: string | null;
  className?: string;
}) {
  const { setEmail } = useProspector();
  const [value, setValue] = useState(email ?? "");

  useEffect(() => {
    setValue(email ?? "");
  }, [email]);

  const commit = () => {
    const next = value.trim();
    if (next !== (email ?? "")) setEmail(id, next);
  };

  return (
    <Input
      type="email"
      inputMode="email"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      placeholder="E-mail (preencher manualmente)"
      aria-label={`E-mail de ${name}`}
      className={className ?? "h-9 text-xs"}
    />
  );
}
