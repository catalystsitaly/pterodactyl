<?php

namespace Pterodactyl\Exceptions\Service\User;

use Pterodactyl\Exceptions\DisplayException;

class TwoFactorAuthenticationTokenInvalid extends DisplayException
{
    /**
     * TwoFactorAuthenticationTokenInvalid constructor.
     */
    public function __construct()
    {
        parent::__construct('提供的双因素认证令牌无效。');
    }
}
