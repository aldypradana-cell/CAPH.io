@echo off
echo ======================================================
echo       CAPH.IO AUTOMATED DEPLOYMENT SCRIPT
echo ======================================================
echo.

echo [1/4] Membersihkan file build lama...
if exist public\build (
    echo Menghapus folder public/build...
    rmdir /s /q public\build
)
if exist bootstrap\ssr (
    echo Menghapus folder bootstrap/ssr...
    rmdir /s /q bootstrap\ssr
)

echo.
echo [2/4] Menjalankan Build (Vite & Typescript)...
echo Perintah: npm run build
call npm run build

echo.
echo [3/4] Membersihkan Cache Laravel...
php artisan optimize:clear

echo.
echo [4/4] Membuat file update.zip LENGKAP...
if exist update.zip (
    del update.zip
)
:: Hapus cache bootstrap & hot file agar tidak terbawa ke server
del /q bootstrap\cache\*.php
if exist public\hot (
    del public\hot
)
tar.exe -a -c -f update.zip app bootstrap config database public resources routes

echo.
echo ======================================================
echo   SELESAI! Update.zip siap di-upload ke Hostinger.
echo ======================================================
echo.
pause
