import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/elements/dialog';
import { DialogProps } from '@/components/elements/dialog/Dialog';
import getTwoFactorTokenData, { TwoFactorTokenData } from '@/api/account/getTwoFactorTokenData';
import { useFlashKey } from '@/plugins/useFlash';
import tw from 'twin.macro';
import QRCode from 'qrcode.react';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import { Input } from '@/components/elements/inputs';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import enableAccountTwoFactor from '@/api/account/enableAccountTwoFactor';
import FlashMessageRender from '@/components/FlashMessageRender';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';

type SetupTOTPModalProps = DialogProps;

export default ({ open, onClose }: SetupTOTPModalProps) => {
    const [submitting, setSubmitting] = useState(false);
    const [value, setValue] = useState('');
    const [tokens, setTokens] = useState<string[]>([]);
    const [token, setToken] = useState<TwoFactorTokenData | null>(null);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);

    useEffect(() => {
        if (!open) return;

        getTwoFactorTokenData()
            .then(setToken)
            .then(() => updateUserData({ useTotp: true }))
            .catch((error) => clearAndAddHttpError(error));
    }, [open]);

    useEffect(() => {
        if (!open) return;

        return () => {
            setToken(null);
            setValue('');
            setSubmitting(false);
            clearAndAddHttpError(undefined);
        };
    }, [open]);

    const submit = () => {
        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();

        enableAccountTwoFactor(value)
            .then(setTokens)
            .catch(clearAndAddHttpError)
            .then(() => setSubmitting(false));
    };

    return (
        <>
            <RecoveryTokensDialog tokens={tokens} open={open && tokens.length > 0} onClose={onClose} />
            <Dialog
                open={open && !tokens.length}
                onClose={onClose}
                title={'启用双因素认证'}
                preventExternalClose={submitting}
                description={
                    "帮助保护您的账户免遭未经授权的访问。 每次登录时都会提示您输入验证码。"
                }
            >
                <FlashMessageRender byKey={'account:two-step'} className={'mt-4'} />
                <div
                    className={
                        'flex items-center justify-center w-56 h-56 p-2 bg-gray-800 rounded-lg shadow mx-auto mt-6'
                    }
                >
                    {!token ? (
                        <Spinner />
                    ) : (
                        <QRCode
                            renderAs={'svg'}
                            value={token.image_url_data}
                            css={tw`w-full h-full shadow-none rounded`}
                        />
                    )}
                </div>
                <CopyOnClick text={token?.secret}>
                    <p className={'font-mono text-sm text-gray-100 text-center mt-2'}>
                        {token?.secret.match(/.{1,4}/g)!.join(' ') || 'Loading...'}
                    </p>
                </CopyOnClick>
                <div className={'mt-6'}>
                    <p>
                        使用您选择的双因素认证应用程序扫描上面的二维码。 然后将生成的 6 位验证码输入到下面的文本框中。
                    </p>
                </div>
                <Input.Text
                    variant={Input.Text.Variants.Loose}
                    value={value}
                    onChange={(e) => setValue(e.currentTarget.value)}
                    className={'mt-4'}
                    placeholder={'000000'}
                    type={'text'}
                    inputMode={'numeric'}
                    autoComplete={'one-time-code'}
                    pattern={'\\d{6}'}
                />
                <Dialog.Footer>
                    <Button.Text onClick={onClose}>Cancel</Button.Text>
                    <Tooltip
                        disabled={value.length === 6}
                        content={
                            !token ? '正在等待二维码加载...' : '您必须输入 6 位验证码才能继续。'
                        }
                        delay={100}
                    >
                        <Button disabled={!token || value.length !== 6} onClick={submit}>
                            启用
                        </Button>
                    </Tooltip>
                </Dialog.Footer>
            </Dialog>
        </>
    );
};
