#!/bin/bash

# Fix common type issues in the Prebuilt components

# Fix event handler parameters (e) - MouseEvent
find src/Prebuilt -name "*.tsx" -o -name "*.ts" | while read file; do
  # onClick handlers
  sed -i '' 's/onClick={e =>/onClick={(e: React.MouseEvent) =>/g' "$file"
  sed -i '' 's/onClick={\([^}]*\) => setOpenSheet(false, \([^}]*\))}/onClick={\1 => setOpenSheet(false, \2 as React.MouseEvent)}/g' "$file"
  
  # onChange handlers  
  sed -i '' 's/onChange={(e) =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' "$file"
  sed -i '' 's/onChange={e =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' "$file"
  sed -i '' 's/onValueChange={(value) =>/onValueChange={(value: string) =>/g' "$file"
  sed -i '' 's/onValueChange={value =>/onValueChange={(value: string) =>/g' "$file"
  
  # onOpenChange handlers
  sed -i '' 's/onOpenChange={value =>/onOpenChange={(value: boolean) =>/g' "$file"
  sed -i '' 's/onOpenChange={(value) =>/onOpenChange={(value: boolean) =>/g' "$file"
  
  # onKeyDown handlers
  sed -i '' 's/onKeyDown={(e) =>/onKeyDown={(e: React.KeyboardEvent) =>/g' "$file"
  sed -i '' 's/onKeyDown={e =>/onKeyDown={(e: React.KeyboardEvent) =>/g' "$file"
  
  # onSubmit handlers
  sed -i '' 's/onSubmit={(event) =>/onSubmit={(event: React.FormEvent) =>/g' "$file"
  sed -i '' 's/onSubmit={event =>/onSubmit={(event: React.FormEvent) =>/g' "$file"
  
  # onCheckedChange handlers
  sed -i '' 's/onCheckedChange={(checked) =>/onCheckedChange={(checked: boolean) =>/g' "$file"
  sed -i '' 's/onCheckedChange={checked =>/onCheckedChange={(checked: boolean) =>/g' "$file"
done

echo "Type fixes applied"