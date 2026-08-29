'use client';
export default function AssistantFooterButton(){return <button type="button" className="footer-ai-link" onClick={()=>window.dispatchEvent(new Event('sultan-pocket:assistant'))} aria-label="Open AI Assistant">✦ AI Assistant</button>}
