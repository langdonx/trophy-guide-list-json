export class tokenParser {
    STATE_TOKEN_OR_TEXT: number;
    STATE_TEXT_FOR_TOKEN: number;
    ACTION_IGNORE: number;
    ACTION_APPEND: number;
    ACTION_COMPLETE: number;

    constructor() {
        this.STATE_TOKEN_OR_TEXT = 1;
        this.STATE_TEXT_FOR_TOKEN = 2;
        this.ACTION_IGNORE = 1;
        this.ACTION_APPEND = 2;
        this.ACTION_COMPLETE = 3;
    }

    parse(input: string, validTokens: string[] = []): Record<string, string> {
        const textToParse = (input || '') + '\x01'
        const tokens: Record<string, string> = { leftOverTerms: '', };

        let action: number, // TODO enum/or piped const list
            chr: string,
            i: number,
            parensLevel = 0,
            state = this.STATE_TOKEN_OR_TEXT,
            textBeingBuilt = '',
            tokenBeingBuilt = '';

        for (i = 0; i < textToParse.length; i++) {
            chr = textToParse[i];
            action = this.ACTION_IGNORE;

            switch (chr) {
                case ':':
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        if (validTokens.length === 0 || validTokens.includes(tokenBeingBuilt) === true) {
                            state = this.STATE_TEXT_FOR_TOKEN;
                        } else {
                            action = this.ACTION_APPEND;
                        }
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        action = this.ACTION_APPEND;
                    }
                    break;

                case '(':
                    if (state === this.STATE_TEXT_FOR_TOKEN) {
                        parensLevel += 1;
                    }

                    if (parensLevel > 1) {
                        action = this.ACTION_APPEND;
                    }
                    break;

                case ')':
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        action = this.ACTION_APPEND;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        parensLevel -= 1;

                        if (parensLevel === 0) {
                            action = this.ACTION_COMPLETE;
                        } else {
                            action = this.ACTION_APPEND;
                        }
                    }
                    break;

                case ' ':
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        if (tokenBeingBuilt !== '') {
                            action = this.ACTION_COMPLETE;
                        }
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        if (parensLevel === 0) {
                            action = this.ACTION_COMPLETE;
                        } else if (parensLevel > 0) {
                            action = this.ACTION_APPEND;
                        }
                    }
                    break;

                case '\x01':
                    if (parensLevel > 0) {
                        state = this.STATE_TOKEN_OR_TEXT;
                        action = this.ACTION_COMPLETE;
                    } else {
                        action = this.ACTION_COMPLETE;
                    }
                    break;

                default:
                    action = this.ACTION_APPEND;
                    break;
            }

            switch (action) {
                case this.ACTION_APPEND:
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        tokenBeingBuilt += chr;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        textBeingBuilt += chr;
                    }
                    break;
                case this.ACTION_COMPLETE:
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        tokens.leftOverTerms += ((tokens.leftOverTerms) ? ' ' : '') + tokenBeingBuilt;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        tokens[tokenBeingBuilt] = (tokens[tokenBeingBuilt] || '') + textBeingBuilt;
                        state = this.STATE_TOKEN_OR_TEXT;
                    }
                    textBeingBuilt = '';
                    tokenBeingBuilt = '';
                    break;
            }
        }

        return tokens;
    }
}
