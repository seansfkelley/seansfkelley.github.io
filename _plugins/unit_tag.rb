# frozen_string_literal: true

class UnitTag < Liquid::Tag
  VALID_SYNTAX = %r!
    (?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w.-]+))
  !x.freeze

  FULL_VALID_SYNTAX = %r!\A\s*(?:#{VALID_SYNTAX}(?=\s|\z)\s*){2}\z!.freeze

  def initialize(tag_name, text, tokens)
    super
    @params = text.strip
    validate_params if @params
    @tag_name = tag_name
  end

  def parse_params(context)
    params = []
    @params.scan(VALID_SYNTAX) do |d_quoted, s_quoted, variable|
      value = if d_quoted
                d_quoted.include?('\\"') ? d_quoted.gsub('\\"', '"') : d_quoted
              elsif s_quoted
                s_quoted.include?("\\'") ? s_quoted.gsub("\\'", "'") : s_quoted
              elsif variable
                context[variable]
              end

      params.push value
    end

    unless params.size == 2
      raise ArgumentError, "expected exactly two arguments for unit tag"
    end

    {
      "imperial" => params[0],
      "metric" => params[1],
    }
  end

  def validate_params
    unless FULL_VALID_SYNTAX.match?(@params)
      raise ArgumentError, <<~MSG
        Invalid syntax for unit tag:
        #{@params}
      MSG
    end
  end

  def render(context)
    site = context.registers[:site]
    page = context.registers[:page]

    params = self.parse_params(context)

    # one-line this to avoid HTML putting in extra spaces due to the newlines/indentation between elements
    "<span class=\"unit metric\">#{params["metric"]}</span><span class=\"unit imperial\">#{params["imperial"]}</span>"
  end
end

Liquid::Template.register_tag("unit", UnitTag)
