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
      wait = self.parse_duration(params["wait"] || "0m")
      shortname = params["shortname"]

      title = if steps.length == 1
                "to begin"
              else
                "#{self.print_duration_longform(wait)} later"
              end

      "<section
        class=\"recipe-step\"
        data-step-index=\"#{steps.length - 1}\"
        data-duration=\"#{duration}\"
        data-wait=\"#{wait}\"
        data-shortname=\"#{shortname}\"
      >
        <h3>
          <hr />
          #{title}
          <hr />
        </h3>
        <h4 class=\"metadata\">
          <span class=\"duration\">#{shortname}: #{self.print_duration_longform(duration)} of work</span>
        </h4>
        #{converter.convert(text)}
      </section>"
    end
  end

  def parse_duration(duration)
    matched = duration.match(DURATION_SYNTAX)
    raise "must provide a duration argument including hours, minutes or both" unless matched

    hours = (matched["hours"] || "0").strip.to_i
    minutes = (matched["minutes"] || "0").strip.to_i

    hours * 60 + minutes
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
