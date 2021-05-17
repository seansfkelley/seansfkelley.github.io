# frozen_string_literal: true

class LiterateRecipeStepTag < Liquid::Block
  VALID_SYNTAX = %r!
    ([\w-]+)\s*=\s*
    (?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w.-]+))
  !x.freeze
  DURATION_SYNTAX = %r!
    \s*
    ((?<hours>\d+)h)?
    \s*
    ((?<minutes>\d+)m)?
    \s*
  !mx.freeze

  FULL_VALID_SYNTAX = %r!\A\s*(?:#{VALID_SYNTAX}(?=\s|\z)\s*)*\z!.freeze

  def initialize(tag_name, text, tokens)
    super
    @params = text.strip
    validate_params if @params
    @tag_name = tag_name
  end

  def syntax_example
    "{% #{@tag_name} param='value' param2='value' %}"
  end

  def parse_params(context)
    params = {}
    @params.scan(VALID_SYNTAX) do |key, d_quoted, s_quoted, variable|
      value = if d_quoted
                d_quoted.include?('\\"') ? d_quoted.gsub('\\"', '"') : d_quoted
              elsif s_quoted
                s_quoted.include?("\\'") ? s_quoted.gsub("\\'", "'") : s_quoted
              elsif variable
                context[variable]
              end

      params[key] = value
    end
    params
  end

  def validate_params
    unless FULL_VALID_SYNTAX.match?(@params)
      raise ArgumentError, <<~MSG
        Invalid syntax for literate_recipe_step tag:
        #{@params}
        Valid syntax:
        #{syntax_example}
      MSG
    end
  end

  def render(context)
    site = context.registers[:site]
    page = context.registers[:page]

    text = super
    converter = site.find_converter_instance(::Jekyll::Converters::Markdown)

    params = self.parse_params(context)
    page[:__recipe_steps__] = [] unless page[:__recipe_steps__]
    steps = page[:__recipe_steps__]
    steps << params


    context.stack do
      duration = self.parse_duration(params["duration"])
      waits = steps.map { |s| self.parse_duration(s["wait"] || "0m") }
      elapsed = waits.reduce(0, :+)

      title = if steps.length == 1
                "to begin"
              else
                "#{self.print_duration_longform(self.parse_duration(params["wait"]))} later"
              end

      begin
        "<section class=\"recipe-step\" data-step-number=\"#{steps.length}\">
          <h3>
            #{title}
            <span class=\"metadata\">
              <span class=\"duration\">#{self.print_duration_longform(duration)} of work</span>
              <span class=\"elapsed\">elapsed: #{self.print_duration_shortform(elapsed)}</span>
            </span>
          </h3>
          #{converter.convert(text)}
          <button class=\"done-button\">
            mark as done
          </button>
        </section>"
      rescue Liquid::Error => e
        e.template_name = path
        e.markup_context = "included " if e.markup_context.nil?
        raise e
      end
    end
  end

  def parse_duration(duration)
    matched = duration.match(DURATION_SYNTAX)
    raise "must provide a duration argument including hours, minutes or both" unless matched

    hours = (matched["hours"] || "0").strip.to_i
    minutes = (matched["minutes"] || "0").strip.to_i

    hours * 60 + minutes
  end

  def print_duration_shortform(duration)
    "%i:%02i" % [duration / 60, duration % 60]
  end

  def print_duration_longform(duration)
    hours = duration / 60
    minutes = duration % 60

    s = if hours == 1
          "1 hour"
        elsif hours > 1
          "#{hours} hours"
        else
          ""
        end

    if minutes > 0
      unless s.empty?
        s += ", "
      end

      s += if minutes == 1
             "1 minute"
           else
             "#{minutes} minutes"
           end
    end

    s
  end
end

Liquid::Template.register_tag("literate_recipe_step", LiterateRecipeStepTag)
