#!/bin/bash

# Wrapper pour exécuter pod sans Bundler

export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export LANG=en_US.UTF-8

# Exécuter pod directement via Ruby
exec /opt/homebrew/opt/ruby/bin/ruby -I /opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/lib /opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod "$@"

