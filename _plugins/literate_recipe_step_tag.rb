# frozen_string_literal: true

class LiterateRecipeStepTag < Liquid::Tag
  VALID_SYNTAX = %r!
    ([\w-]+)\s*=\s*
    (?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w.-]+))
  !x.freeze

  DURATION_SYNTAX = %r!
    (
      ((?<hours>\d+)h)?
      \s*
      ((?<minutes>\d+)m)?
    )|overnight
  !mx.freeze

  FULL_VALID_SYNTAX = %r!\A\s*(?:#{VALID_SYNTAX}(?=\s|\z)\s*)*\z!.freeze

  def initialize(tag_name, text, tokens)
    super
    @params = text.strip
    validate_params if @params
    @tag_name = tag_name
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
      MSG
    end
  end

  def render(context)
    site = context.registers[:site]
    page = context.registers[:page]

    params = self.parse_params(context)
    kind = params["kind"]

    if kind
      if params["wait"]
        raise "cannot specify both kind and wait"
      end

      wait = :overnight
      page[:step_groups] = [[]]
    else
      wait = self.parse_duration(params["wait"])

      if wait == :overnight
        page[:step_groups] << []
      end
    end

    duration = self.parse_duration(params["duration"])

    page[:step_groups].last << params

    title = \
      if kind == "multiday"
        "day 1"
      elsif kind == "default"
        "to begin"
      else
        "#{self.print_duration_longform(
          wait,
          overnight_text: "day #{page[:step_groups].length}",
          non_overnight_suffix: " later"
        )}"
      end

    <<~END
      <header
        class="recipe-step"
        data-step-group="#{page[:step_groups].length - 1}"
        data-step-index="#{page[:step_groups].last.length - 1}"
        data-duration="#{duration}"
        data-wait="#{wait}"
      >
        <h3>
          <hr />
            #{title}
          <hr />
        </h3>
        <h4 class="metadata">
          <span class="duration">
            #{self.print_duration_longform(duration)} of work
          </span>
        </h4>
      </header>
    END
  end

  def parse_duration(duration)
    if duration == 'overnight'
      return :overnight
    end

    matched = duration.match(DURATION_SYNTAX)
    raise "must provide a duration argument including hours, minutes or both" unless matched

    hours = (matched["hours"] || "0").strip.to_i
    minutes = (matched["minutes"] || "0").strip.to_i

    hours * 60 + minutes
  end

  def print_duration_longform(duration, overnight_text: nil, non_overnight_suffix: nil)
    if duration == :overnight
      return overnight_text || "the next day"
    end

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

    s + (non_overnight_suffix || "")
  end
end

Liquid::Template.register_tag("literate_recipe_step", LiterateRecipeStepTag)
