import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { action } = await request.json();

  if (action === 'lock') {
    console.log("Focus Mode: Locked (UI only, enforcer disabled for safety)");
    return NextResponse.json({ success: true, message: "Focus Mode Active" });
  }

  if (action === 'unlock') {
    console.log("Focus Mode: Unlocked");
    return NextResponse.json({ success: true, message: "Focus Mode Disabled" });
  }

  return NextResponse.json({ success: true });
}
