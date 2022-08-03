#!/bin/ash -e
cd /app

mkdir -p /var/log/panel/logs/ /var/log/supervisord/ /var/log/nginx/ /var/log/php7/ \
  && chmod 777 /var/log/panel/logs/ \
  && ln -s /var/log/panel/logs/ /app/storage/logs/

## 检查 .env 文件并在缺少时生成应用程序密钥
if [ -f /app/var/.env ]; then
  echo "存在外部变量."
  rm -rf /app/.env
  ln -s /app/var/.env /app/
else
  echo "不存在外部变量."
  rm -rf /app/.env
  touch /app/var/.env

  ## 由于 key generate --force 失败，手动生成密钥
  if [ -z $APP_KEY ]; then
     echo -e "生成密钥."
     APP_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
     echo -e "生成的应用程序密钥：$APP_KEY"
     echo -e "APP_KEY=$APP_KEY" > /app/var/.env
  else
    echo -e "APP_KEY 存在于环境中，已使用它."
    echo -e "APP_KEY=$APP_KEY" > /app/var/.env
  fi

  ln -s /app/var/.env /app/
fi

echo "正在检查是否需要 https."
if [ -f /etc/nginx/http.d/panel.conf ]; then
  echo "nginx 配置已经就位."
  if [ $LE_EMAIL ]; then
    echo "正在检查证书更新"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  else
    echo "未设置 Letsencrypt 电子邮箱"
  fi
else
  echo "正在检查是否设置了 letsencrypt 电子邮箱."
  if [ -z $LE_EMAIL ]; then
    echo "http 配置文件中没有设置 letencrypt 电子邮箱."
    cp .github/docker/default.conf /etc/nginx/http.d/panel.conf
  else
    echo "编写 ssl 配置"
    cp .github/docker/default_ssl.conf /etc/nginx/http.d/panel.conf
    echo "正在更新域名的 ssl 配置"
    sed -i "s|<domain>|$(echo $APP_URL | sed 's~http[s]*://~~g')|g" /etc/nginx/http.d/panel.conf
    echo "生成证书"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  fi
  echo "删除默认的 nginx 配置"
  rm -rf /etc/nginx/http.d/default.conf
fi

if [[ -z $DB_PORT ]]; then
  echo -e "未指定 DB_PORT，默认为 3306"
  DB_PORT=3306
fi

## 在启动面板之前检查数据库
echo "正在检查数据库状态."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "正在等待数据库连接..."
  # 等待 1 秒再检查
  sleep 1
done

## 确保数据库已设置
echo -e "迁移或生成数据库"
php artisan migrate --seed --force

## 启动队列的 cronjobs
echo -e "正在启动 cron 作业."
crond -L /var/log/crond -l 5

echo -e "正在启动 supervisord."
exec "$@"
