source "https://rubygems.org"

ruby "3.3.1"

gem "jekyll", "~> 4"
gem "html-proofer", "~> 5.0.8"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-seo-tag", "~> 2"
  gem "jekyll-redirect-from", "~> 0.16"
end

install_if -> { Gem::Version.new(RUBY_VERSION) >= Gem::Version.new("3.3") } do
  # https://github.com/jekyll/jekyll/pull/9522
  gem "csv", "~> 3.0"

  # https://github.com/Shopify/liquid/issues/1772
  gem "base64"
  gem "bigdecimal"
end
