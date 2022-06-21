import React, { useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/ServerConsole';
import { Dialog } from '@/components/elements/dialog';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [ open, setOpen ] = useState(false);
    const status = ServerContext.useStoreState(state => state.status.value);
    const instance = ServerContext.useStoreState(state => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (action: PowerAction | 'kill-confirmed', e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'强制停止进程'}
                confirm={'继续'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                强行停止服务器会导致数据损坏。
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <Button
                    className={'w-24'}
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                >
                    开机
                </Button>
            </Can>
            <Can action={'control.restart'}>
                <Button.Text
                    className={'w-24'}
                    variant={Button.Variants.Secondary}
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                >
                    重启
                </Button.Text>
            </Can>
            <Can action={'control.stop'}>
                <Button.Danger
                    className={'w-24'}
                    variant={killable ? undefined : Button.Variants.Secondary}
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                >
                    {killable ? '强制停止' : '停止'}
                </Button.Danger>
            </Can>
        </div>
    );
};
