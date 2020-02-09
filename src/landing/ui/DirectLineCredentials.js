import { decode } from 'jsonwebtoken';
import { useDispatch } from 'react-redux';
import ms from 'ms';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import generateDirectLineToken from '../data/action/generateDirectLineToken';
import useDirectLineSecret from '../data/hooks/useDirectLineSecret';
import useDirectLineToken from '../data/hooks/useDirectLineToken';
import useSavedDirectLineSecrets from '../data/hooks/useSavedDirectLineSecrets';

import Presets from './Presets';
import Row from './Row';

const EXPIRED_FOOTNOTE_STYLE = { color: 'Red' };
const INPUT_ROW_STYLE = { display: 'flex', flex: 1 };
const SECRET_AND_TOKEN_STYLE = { flex: 1, fontFamily: `Consolas, 'Courier New', monospace`, marginRight: '1em' };

const Credential = () => {
  const dispatch = useDispatch();

  const [secret, setSecret] = useDirectLineSecret();
  const [token, setToken] = useDirectLineToken();
  const [savedSecrets, saveSecret, removeSavedSecret] = useSavedDirectLineSecrets();

  const savedSecretsTexts = useMemo(() => savedSecrets.map(secret => () => <code>{ (secret || '').substr(0, 5) + '…' }</code>), [savedSecrets]);

  const handleClearTokenClick = useCallback(() => setToken(''), [setToken]);
  const handleFocus = useCallback(({ target }) => target.select());
  const handleGenerateTokenClick = useCallback(() => dispatch(generateDirectLineToken()), ['dispatch']);
  const handleLoadSecret = useCallback(value => {
    setSecret(value);
    setToken('');
  }, [setSecret]);
  const handleSaveSecret = useCallback(() => saveSecret(secret));
  const handleSecretChange = useCallback(({ target: { value } }) => setSecret(value), [setSecret]);
  const handleTokenChange = useCallback(({ target: { value } }) => setToken(value), [setToken]);

  const secretDisabled = !!token;
  const decodedToken = decode(token);
  const timeToExpire = decodedToken && (decodedToken.exp * 1000 - Date.now());

  const [, setForceRender] = useState();

  useEffect(() => {
    if (decodedToken) {
      const timeout = setTimeout(() => setForceRender({}), 60000);

      return () => clearTimeout(timeout);
    }
  }, [decodedToken]);

  return (
    <React.Fragment>
      <Row header="Secret">
        <div style={ INPUT_ROW_STYLE }>
          <input
            disabled={ secretDisabled }
            onChange={ handleSecretChange }
            onFocus={ handleFocus }
            placeholder={ token ? '<No secret>' : '' }
            required={ !secretDisabled }
            style={ SECRET_AND_TOKEN_STYLE }
            title={ secretDisabled ? 'You cannot set secret with token set. Please clear token first.' : '' }
            type="text"
            value={ secret }
          />
          <button
            disabled={ !secret || !!token }
            onClick={ handleGenerateTokenClick }
            type="button"
          >
            Generate token
          </button>
        </div>
        <small>
          <Presets
            onDelete={ removeSavedSecret }
            onLoad={ handleLoadSecret }
            onSave={ handleSaveSecret }
            texts={ savedSecretsTexts }
            values={ savedSecrets }
          />
        </small>
      </Row>
      <Row header="Token">
        <div style={ INPUT_ROW_STYLE }>
          <input
            onChange={ handleTokenChange }
            onFocus={ handleFocus }
            style={ SECRET_AND_TOKEN_STYLE }
            title={ decodedToken && JSON.stringify(decodedToken, null, 2) }
            type="text"
            value={ token }
          />
          <button
            onClick={ handleClearTokenClick }
            type="button"
          >
            Clear
          </button>
        </div>
        {
          secretDisabled && (
            timeToExpire > 0 ?
              <div>
                <small>This token will expire in { ms(timeToExpire, { long: true }) }.</small>
              </div>
            :
              <div style={ EXPIRED_FOOTNOTE_STYLE }>
                <small>This token has already expired.</small>
              </div>
          )
        }
      </Row>
    </React.Fragment>
  );
};

export default Credential
