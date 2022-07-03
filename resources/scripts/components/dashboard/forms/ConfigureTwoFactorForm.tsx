import React, { useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import SetupTOTPModal from '@/components/dashboard/forms/SetupTOTPModal';
import DisableTwoFactorModal from '@/components/dashboard/forms/DisableTwoFactorModal';

export default () => {
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data!.useTotp);

    return (
        <div>
            <SetupTOTPModal open={visible === 'enable'} onClose={() => setVisible(null)} />
            <DisableTwoFactorModal visible={visible === 'disable'} onModalDismissed={() => setVisible(null)} />
            <p css={tw`text-sm`}>
                {isEnabled
                    ? '您的帐户当前启用了双因素认证。'
                    : '您目前没有在您的帐户上启用双因素认证，单击下面的按钮即可开始配置。'}
            </p>
            <div css={tw`mt-6`}>
                {isEnabled ? (
                    <Button.Danger onClick={() => setVisible('disable')}>禁用双因素认证</Button.Danger>
                ) : (
                    <Button onClick={() => setVisible('enable')}>启用双因素认证</Button>
                )}
            </div>
        </div>
    );
};
