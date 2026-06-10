import { Metadata } from "next";
import { TimelineClient } from "./timeline-client";
export const metadata: Metadata = { title: "Timeline" };
export default function TimelinePage() { return <TimelineClient />; }
