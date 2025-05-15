module Jekyll
  module NegateFilter
    # Liquid is such trash... it (understandably) doesn't interpolate anything if you try to
    # interpolate `false`, but since it implements its own shitty mini-parser, you can't do stuff
    # like `(not input) | string` or `assign notInput = not input`, so I have to make a whole new
    # operator for what looks like it should be a language-level construct, but isn't.
    def negate(input)
      if input.respond_to? :-
        -input
      else
        not input
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::NegateFilter)
