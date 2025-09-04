#!/bin/bash

echo "Fixing final TypeScript errors..."

# 1. Fix App.tsx string | undefined issue
echo "Fixing App.tsx string | undefined..."
sed -i '' 's/themeType: theme\.name,/themeType: theme.name || "",/g' src/Prebuilt/App.tsx

# 2. Fix AudioVideoToggle.tsx event handlers
echo "Fixing AudioVideoToggle.tsx event handlers..."
sed -i '' 's/onClick={(e) =>/onClick={(e: React.MouseEvent) =>/g' src/Prebuilt/components/AudioVideoToggle.tsx
sed -i '' 's/onOpenChange={(value) =>/onOpenChange={(value: boolean) =>/g' src/Prebuilt/components/AudioVideoToggle.tsx

# 3. Fix ChatActions.tsx MouseEvent types
echo "Fixing ChatActions.tsx MouseEvent types..."
sed -i '' 's/as React\.MouseEvent)/as React.MouseEvent<HTMLElement>)/g' src/Prebuilt/components/Chat/ChatActions.tsx

# 4. Fix ChatBody.tsx MouseEvent types
echo "Fixing ChatBody.tsx MouseEvent types..."
sed -i '' 's/as React\.MouseEvent)/as React.MouseEvent<HTMLElement>)/g' src/Prebuilt/components/Chat/ChatBody.tsx

# 5. Fix ChatFooter.tsx event handlers and null check
echo "Fixing ChatFooter.tsx..."
sed -i '' 's/inputRef\.current\[/inputRef.current?.[/g' src/Prebuilt/components/Chat/ChatFooter.tsx
sed -i '' 's/onChange={(event) =>/onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>/g' src/Prebuilt/components/Chat/ChatFooter.tsx
sed -i '' 's/onKeyDown={(e) =>/onKeyDown={(e: React.KeyboardEvent) =>/g' src/Prebuilt/components/Chat/ChatFooter.tsx
sed -i '' 's/onPaste={(e) =>/onPaste={(e: React.ClipboardEvent) =>/g' src/Prebuilt/components/Chat/ChatFooter.tsx
sed -i '' 's/onCut={(e) =>/onCut={(e: React.ClipboardEvent) =>/g' src/Prebuilt/components/Chat/ChatFooter.tsx

# 6. Fix FeedbackForm.tsx
echo "Fixing FeedbackForm.tsx..."
sed -i '' 's/onChange={(event) =>/onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>/g' src/Prebuilt/components/EndCallFeedback/FeedbackForm.tsx
# Fix Sheet.Content props
sed -i '' 's/onPointerDownOutside={(e: Event)/onPointerDownOutside={(e: any)/g' src/Prebuilt/components/EndCallFeedback/FeedbackForm.tsx
sed -i '' 's/onInteractOutside={(e: Event)/onInteractOutside={(e: any)/g' src/Prebuilt/components/EndCallFeedback/FeedbackForm.tsx

# 7. Fix ParticipantList.tsx
echo "Fixing ParticipantList.tsx..."
sed -i '' 's/onKeyDown={(event) =>/onKeyDown={(event: React.KeyboardEvent) =>/g' src/Prebuilt/components/Footer/ParticipantList.tsx
sed -i '' 's/onChange={(event) =>/onChange={(event: React.ChangeEvent<HTMLInputElement>) =>/g' src/Prebuilt/components/Footer/ParticipantList.tsx

# 8. Fix HLSAutoplayBlockedPrompt.tsx
echo "Fixing HLSAutoplayBlockedPrompt.tsx..."
sed -i '' 's/onOpenChange={(value) =>/onOpenChange={(value: boolean) =>/g' src/Prebuilt/components/HMSVideo/HLSAutoplayBlockedPrompt.tsx

# 9. Fix VolumeControl.tsx
echo "Fixing VolumeControl.tsx..."
sed -i '' 's/onInputChange={(event) =>/onInputChange={(event: any) =>/g' src/Prebuilt/components/HMSVideo/VolumeControl.tsx
sed -i '' 's/onChange={(event) =>/onChange={(event: any) =>/g' src/Prebuilt/components/HMSVideo/VolumeControl.tsx
sed -i '' 's/onValueChange={(volume) =>/onValueChange={(volume: number[]) =>/g' src/Prebuilt/components/HMSVideo/VolumeControl.tsx

# 10. Fix IconButtonWithOptions.tsx
echo "Fixing IconButtonWithOptions.tsx..."
sed -i '' 's/onClick={(e) =>/onClick={(e: React.MouseEvent) =>/g' src/Prebuilt/components/IconButtonWithOptions/IconButtonWithOptions.tsx

# 11. Fix ChangeNameContent.tsx
echo "Fixing ChangeNameContent.tsx..."
sed -i '' 's/onKeyDown={(e) =>/onKeyDown={(e: React.KeyboardEvent) =>/g' src/Prebuilt/components/MoreSettings/ChangeNameContent.tsx

# 12. Fix DesktopOptions.tsx
echo "Fixing DesktopOptions.tsx..."
sed -i '' 's/onSubmit={(e) =>/onSubmit={(e: React.FormEvent) =>/g' src/Prebuilt/components/MoreSettings/SplitComponents/DesktopOptions.tsx

# 13. Fix AutoplayBlockedModal.tsx
echo "Fixing AutoplayBlockedModal.tsx..."
sed -i '' 's/onOpenChange={(value) =>/onOpenChange={(value: boolean) =>/g' src/Prebuilt/components/Notifications/AutoplayBlockedModal.tsx

echo "Type fixes applied!"