<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Illuminate\Contracts\Validation\Factory;
use Pterodactyl\Services\Users\TwoFactorSetupService;
use Pterodactyl\Services\Users\ToggleTwoFactorService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class TwoFactorController extends ClientApiController
{
    /**
     * @var \Pterodactyl\Services\Users\TwoFactorSetupService
     */
    private $setupService;

    /**
     * @var \Illuminate\Contracts\Validation\Factory
     */
    private $validation;

    /**
     * @var \Pterodactyl\Services\Users\ToggleTwoFactorService
     */
    private $toggleTwoFactorService;

    /**
     * TwoFactorController constructor.
     */
    public function __construct(
        ToggleTwoFactorService $toggleTwoFactorService,
        TwoFactorSetupService $setupService,
        Factory $validation
    ) {
        parent::__construct();

        $this->setupService = $setupService;
        $this->validation = $validation;
        $this->toggleTwoFactorService = $toggleTwoFactorService;
    }

    /**
     * Returns two-factor token credentials that allow a user to configure
     * it on their account. If two-factor is already enabled this endpoint
     * will return a 400 error.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function index(Request $request)
    {
        if ($request->user()->use_totp) {
            throw new BadRequestHttpException('此帐户已启用动态口令认证。');
        }

        return new JsonResponse([
            'data' => $this->setupService->handle($request->user()),
        ]);
    }

    /**
     * Updates a user's account to have two-factor enabled.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Throwable
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        $validator = $this->validation->make($request->all(), [
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string'],
        ]);

        $data = $validator->validate();
        if (!password_verify($data['password'], $request->user()->password)) {
            throw new BadRequestHttpException('提供的密码无效。');
        }

        $tokens = $this->toggleTwoFactorService->handle($request->user(), $data['code'], true);

        Activity::event('user:two-factor.create')->log();

        return new JsonResponse([
            'object' => 'recovery_tokens',
            'attributes' => [
                'tokens' => $tokens,
            ],
        ]);
    }

    /**
     * Disables two-factor authentication on an account if the password provided
     * is valid.
     *
     * @return \Illuminate\Http\JsonResponse
     * @throws \Throwable
     */
    public function delete(Request $request)
    {
        if (!password_verify($request->input('password') ?? '', $request->user()->password)) {
            throw new BadRequestHttpException('提供的密码无效。');
        }

        /** @var \Pterodactyl\Models\User $user */
        $user = $request->user();

        $user->update([
            'totp_authenticated_at' => Carbon::now(),
            'use_totp' => false,
        ]);

        Activity::event('user:two-factor.delete')->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
