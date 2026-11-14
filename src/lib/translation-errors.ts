/** Safe diagnostics only; never forward provider bodies, headers or credentials. */
export type TranslationFailure = {
  code: string;
  httpStatus?: number | undefined;
};

export function translationFailureMessage(error: TranslationFailure): string {
  const detail = ` (${error.code}${error.httpStatus ? `; HTTP ${error.httpStatus}` : ""})`;
  if (error.code === "payment_required") return `Tradução bloqueada: o serviço de IA exige créditos. O proprietário precisa adicionar créditos de IA no Lovable antes de tentar novamente${detail}. Nenhuma tradução foi substituída por português.`;
  if (error.code === "rate_limited") return `O serviço de tradução atingiu o limite de solicitações. Aguarde antes de tentar novamente${detail}.`;
  if (error.code === "authentication_error" || error.code === "configuration_error") return `O acesso ao serviço de tradução precisa ser corrigido pelo proprietário${detail}.`;
  if (error.code === "permission_denied") return `O serviço de tradução negou o acesso. O administrador precisa revisar as permissões${detail}.`;
  if (["timeout", "cancelled", "network_error", "operation_failed"].includes(error.code)) return `Não foi possível confirmar a conclusão da tradução. Ela pode ter iniciado; confira antes de solicitar outra${detail}.`;
  return `O serviço de tradução não concluiu a solicitação${detail}. Nenhuma mensagem em português foi usada como substituição.`;
}