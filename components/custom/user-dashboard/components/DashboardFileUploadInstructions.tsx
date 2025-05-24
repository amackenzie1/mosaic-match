import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import React, { useState } from "react";

// Dynamically import icons with SSR disabled
const MessageCircle = dynamic(
  () => import("lucide-react").then((mod) => mod.MessageCircle),
  { ssr: false }
);
const Send = dynamic(() => import("lucide-react").then((mod) => mod.Send), {
  ssr: false,
});
const MessageSquare = dynamic(
  () => import("lucide-react").then((mod) => mod.MessageSquare),
  { ssr: false }
);
const Instagram = dynamic(
  () => import("lucide-react").then((mod) => mod.Instagram),
  { ssr: false }
);
const Facebook = dynamic(
  () => import("lucide-react").then((mod) => mod.Facebook),
  { ssr: false }
);
const Smartphone = dynamic(
  () => import("lucide-react").then((mod) => mod.Smartphone),
  { ssr: false }
);

interface DashboardFileUploadInstructionsProps {
  onFileTypeSelect: (fileType: string) => void;
  onTryItOutClick: () => void;
  sampleFileVisible: boolean;
  onSampleFileDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  showTryItOut?: boolean;
}

const fileTypes = [
  { name: "WhatsApp (Mobile)", icon: MessageSquare },
  { name: "WhatsApp (Laptop)", icon: MessageSquare },
  { name: "iMessage (Mac)", icon: MessageCircle },
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: Facebook },
  { name: "Telegram (Laptop)", icon: Send },
  { name: "Android", icon: Smartphone },
];

interface Instruction {
  title: string;
  steps: string[];
  fileType: string;
}

const instructions: Instruction[] = [
  {
    fileType: "WhatsApp (Mobile)",
    title: "How do I export my WhatsApp chat from my phone (easiest)",
    steps: [
      "Go to Settings ⚙️",
      'Select "Chats" 💬',
      'Click on "Export chat"',
      "Select the chat you wish to export",
      'Click on "Without Media", and choose how you wish to export to your laptop',
      "Switch to your laptop and click the Upload File button above (you can also drag and drop files onto the button from mail/messages) and select your file!",
    ],
  },
  {
    fileType: "WhatsApp (Laptop)",
    title: "How do I export my WhatsApp chat (Others)?",
    steps: [
      "Open the chat you wish to export",
      "Tap More options > More > Export chat",
      "Tap without media and save to downloads. For mobile devices you can message, email, or airdrop the file to yourself.",
      "Click the Upload File button above (can also drag and drop files into the button from mail/messages) and select your file!",
    ],
  },
  {
    fileType: "iMessage (Mac)",
    title: "How do I export my iMessage chat (Mac)?",
    steps: [
      "READ THE WHOLE THING BEFORE UPLOADING CHAT",
      "Copy this file path: ~/Library/Messages and click on the upload file button.",
      "Hold Command + Shift + G on your keyboard, and paste ~/Library/Messages into the search bar",
      "Select the first option that comes up { > Library > Messages }",
      "Select the chat.db file and wait for the pop up menu (this can take a while depending on how much you use imessage, sometimes over a minute)",
      "Finally, in the chat pop up menu, select the chat you wish to analyze",
      "Please note that the file includes your entire imessage history, it is once the file is finished processing that you can select your individual chats",
    ],
  },
  {
    fileType: "Facebook",
    title: "How do I export my Facebook chat?",
    steps: [
      "Open the Messenger app and go to Settings ⚙️",
      "Scroll down and select See more in Accounts Center",
      'Select "Your information and permissions", then Download Your Information, pressing the Download or transfer information button, choosing your account, and selecting Some of your Information',
      'Search Messages, select Download to Device and select the chat history you wish to export. By default, you get one year of messages, but you can select "All Time" for completeness.',
      'VERY IMPORTANT: Click on "Format", and select "JSON", and "Low Quality". Once ready, input your email and receive your file (in a few hours)',
      "Mow the lawn, watch a series and wait for that email notification!",
      "Download the file from your instagram/facebook app and transfer it to your computer (email, messages, airdrop etc.)",
      "Click the Upload File button and select your file, or drag and drop it above!",
    ],
  },
  {
    fileType: "Instagram",
    title: "How do I export my Instagram chat?",
    steps: [
      "Open the Instagram app and click on your profile, then navigate to Settings and Activity (the three bars in the top right of your profile page)",
      "Select Your Activity",
      "Scroll all the way down and click Download Your Information, pressing the Download or transfer information button, choosing your account, and selecting Some of your Information",
      'Search Messages, select Download to Device and select the chat history you wish to export. By default, you get one year of messages, but you can select "All Time" for completeness.',
      'VERY IMPORTANT: Click on "Format", and select "JSON", and "Low Quality". Once ready, input your email and receive your file (in a few hours)',
      "Mow the lawn, watch a series and wait for that email notification!",
      "Download the file from your instagram/facebook app and transfer it to your computer (email, messages, airdrop etc.)",
      "Click the Upload File button and select your file, or drag and drop it above!",
    ],
  },
  {
    fileType: "Telegram (Laptop)",
    title: "How do I export my Telegram chat (Laptop)?",
    steps: [
      "Open Telegram Desktop on your computer.",
      "Click on the three dots in the top-right corner to open the menu.",
      "Select 'export chat history' from the menu.",
      "De-select all checkable items",
      "Select the 'Machine-readable JSON' format next to 'Format'.",
      "Click 'Export'",
      "Once the export is complete navigate back to Mosaic, click the Upload File button above and select your exported file.",
    ],
  },
  {
    fileType: "Android",
    title: "How do I export my Android chat?",
    steps: [
      "https://www.wikihow.com/Copy-an-Entire-Text-Conversation-on-Android",
    ],
  },
];

const DashboardFileUploadInstructions: React.FC<
  DashboardFileUploadInstructionsProps
> = ({
  onFileTypeSelect,
  onTryItOutClick,
  sampleFileVisible,
  onSampleFileDragStart,
  showTryItOut = true,
}) => {
  const [expandedFileType, setExpandedFileType] = useState<string | null>(null);

  const handleFileTypeClick = (fileType: string) => {
    setExpandedFileType(expandedFileType === fileType ? null : fileType);
    onFileTypeSelect(fileType);
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">
        From which chat application do you want to export your chat?
      </h2>
      <Accordion
        type="single"
        collapsible
        value={expandedFileType || ""}
        onValueChange={setExpandedFileType}
        className="space-y-2"
      >
        {fileTypes.map((fileType) => (
          <AccordionItem
            key={fileType.name}
            value={fileType.name}
            className="border-2 border-border rounded-lg overflow-hidden"
          >
            <AccordionTrigger
              onClick={() => handleFileTypeClick(fileType.name)}
              className="px-4 py-3 hover:no-underline hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <fileType.icon className="h-5 w-5" />
                <span>{fileType.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3">
              {instructions.find(
                (instruction) => instruction.fileType === fileType.name
              ) ? (
                <div className="space-y-2">
                  {instructions
                    .find(
                      (instruction) => instruction.fileType === fileType.name
                    )
                    ?.steps.map((step, stepIndex) => (
                      <React.Fragment key={stepIndex}>
                        <div className="py-2">
                          <p className="text-sm">
                            <strong>Step {stepIndex + 1}:</strong> {step}
                          </p>
                        </div>
                        {stepIndex <
                          instructions.find(
                            (i) => i.fileType === fileType.name
                          )!.steps.length -
                            1 && <Separator className="my-2" />}
                      </React.Fragment>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Instructions for {fileType.name} are coming soon...
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default DashboardFileUploadInstructions;
