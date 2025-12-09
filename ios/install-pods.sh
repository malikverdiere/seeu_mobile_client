#!/bin/bash

# Script pour installer les pods avec la bonne version de CocoaPods

# Utiliser Ruby Homebrew
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Vérifier la version
echo "🔍 Version Ruby: $(ruby -v)"
echo "🔍 Version CocoaPods: $(/opt/homebrew/opt/ruby/bin/gem list cocoapods | grep cocoapods | head -1)"

# Utiliser directement le binaire CocoaPods de Homebrew
/opt/homebrew/opt/ruby/bin/gem exec bundle exec pod install || \
/opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod install

