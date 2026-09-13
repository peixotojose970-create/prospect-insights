import { useState } from "react";
import { Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildUSOutreachEmail } from "@/features/prospector/us-messages";
import { copyText } from "@/features/prospector/ui";
import type { Business } from "@/types";

export function USEmailDialog({ business, onOpenChange }: { business: Business | null; onOpenChange: (open: boolean) => void }) {
  const [recipient, setRecipient] = useState("");
  if (!business) return null;
  const message = buildUSOutreachEmail(business);
  const mailto = recipient.trim() ? `mailto:${recipient.trim()}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}` : "";
  return <Dialog open={!!business} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Ready-to-send US email</DialogTitle><DialogDescription>{business.name}</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-2"><Label>Email recipient</Label><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="owner@example.com" type="email" /></div>
        <div className="rounded-md border bg-muted/40 p-3 text-sm"><strong>{message.subject}</strong><p className="mt-2 whitespace-pre-wrap leading-relaxed">{message.body}</p></div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copyText(message.body, "Email copied.")}><Copy className="size-4" /> Copy email</Button>
          {mailto ? <Button variant="outline" asChild><a href={mailto}><Mail className="size-4" /> Send email</a></Button> : null}
        </div>
        <p className="text-xs text-muted-foreground">The Google Maps data does not provide business email addresses here, so enter the recipient address you found before sending.</p>
      </div>
    </DialogContent>
  </Dialog>;
}
