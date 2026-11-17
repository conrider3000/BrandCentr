export interface CoolifyDeployResult {
  ok: boolean;
  simulated?: boolean;
  deploymentUuid?: string;
  message: string;
}

export async function triggerCoolifyDeploy(
  appUuid: string,
  brandName: string
): Promise<CoolifyDeployResult> {
  const apiUrl = process.env.COOLIFY_API_URL?.replace(/\/+$/, '');
  const apiToken = process.env.COOLIFY_API_TOKEN?.trim();

  if (!appUuid) {
    return {
      ok: false,
      message: `Cliente "${brandName}" não possui Coolify App UUID configurado.`,
    };
  }

  if (!apiUrl || !apiToken || apiToken.includes('coloque-seu-token')) {
    return {
      ok: true,
      simulated: true,
      deploymentUuid: `sim_${Date.now()}`,
      message: `Deploy simulado para ${brandName} (${appUuid}). Configure COOLIFY_API_TOKEN para disparo real na VPS.`,
    };
  }

  try {
    const res = await fetch(`${apiUrl}/deploy?uuid=${encodeURIComponent(appUuid)}&force=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        message: `Coolify API retornou HTTP ${res.status}: ${body.slice(0, 180)}`,
      };
    }

    const data = (await res.json()) as {
      deployments?: Array<{ deployment_uuid?: string }>;
      message?: string;
    };

    return {
      ok: true,
      deploymentUuid: data.deployments?.[0]?.deployment_uuid,
      message:
        data.message ||
        `Deploy acionado via Coolify para ${brandName} (${appUuid}).`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Falha ao conectar na API do Coolify: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    };
  }
}
