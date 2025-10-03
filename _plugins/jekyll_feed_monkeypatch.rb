module JekyllFeed
  class Generator
    def feed_source_path
      @feed_source_path ||= File.expand_path "../feed-template.xml", __dir__
    end
  end
end
