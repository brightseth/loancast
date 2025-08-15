import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export interface HumanSession {
  fid: number;
  displayName?: string;
  pfpUrl?: string;
  verifiedWallet?: string;
  signerUuid?: string;
  loginTime?: number;
}

export async function getHumanSession(req: NextRequest): Promise<HumanSession | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (!session.fid) {
      return null;
    }

    return {
      fid: Number(session.fid),
      displayName: session.displayName,
      pfpUrl: session.pfpUrl,
      verifiedWallet: session.verifiedWallet,
      signerUuid: session.signerUuid,
      loginTime: session.loginTime
    };
  } catch (error) {
    console.error('Human session parse error:', error);
    return null;
  }
}