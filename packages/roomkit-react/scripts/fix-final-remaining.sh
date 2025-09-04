#!/bin/bash

echo "Fixing final remaining TypeScript errors..."

# Fix event handlers with (e) parameter
sed -i '' 's/onSubmit={(e) =>/onSubmit={(e: React.FormEvent) =>/g' src/Prebuilt/components/Settings/LayoutSettings.tsx
sed -i '' 's/onSubmit={(e) =>/onSubmit={(e: React.FormEvent) =>/g' src/Prebuilt/components/TileMenu/TileMenuContent.tsx
sed -i '' 's/onChange={(e) =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' src/Prebuilt/components/VirtualBackground/VBPicker.tsx

# Fix RoleChangeModal useState
sed -i '' 's/useState<string>()/useState<string>("")/g' src/Prebuilt/components/RoleChangeModal.tsx

# Fix useRef null types
sed -i '' 's/useRef<HTMLDivElement | null>(null)/useRef<HTMLDivElement>(null!)/g' src/Prebuilt/components/ScreenshareTile.tsx
sed -i '' 's/useRef<HTMLDivElement | null>(null)/useRef<HTMLDivElement>(null!)/g' src/Prebuilt/plugins/CaptionsViewer.tsx
sed -i '' 's/useRef(null)/useRef<HTMLDivElement>(null!)/g' src/Prebuilt/components/ScreenshareTile.tsx
sed -i '' 's/useRef(null)/useRef<HTMLDivElement>(null!)/g' src/Prebuilt/plugins/CaptionsViewer.tsx

echo "Final remaining fixes applied!"