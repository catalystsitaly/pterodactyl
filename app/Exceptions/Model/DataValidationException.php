<?php

namespace Pterodactyl\Exceptions\Model;

use Illuminate\Contracts\Validation\Validator;
use Pterodactyl\Exceptions\PterodactylException;
use Illuminate\Contracts\Support\MessageProvider;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class DataValidationException extends PterodactylException implements HttpExceptionInterface, MessageProvider
{
    /**
     * The validator instance.
     *
     * @var \Illuminate\Contracts\Validation\Validator
     */
    public $validator;

    /**
     * DataValidationException constructor.
     */
    public function __construct(Validator $validator)
    {
        parent::__construct(
            '执行数据库写入操作时遇到数据完整性异常。 ' . $validator->errors()->toJson()
        );

        $this->validator = $validator;
    }

    /**
     * Return the validator message bag.
     *
     * @return \Illuminate\Support\MessageBag
     */
    public function getMessageBag()
    {
        return $this->validator->errors();
    }

    /**
     * Return the status code for this request.
     *
     * @return int
     */
    public function getStatusCode()
    {
        return 500;
    }

    /**
     * @return array
     */
    public function getHeaders()
    {
        return [];
    }
}
