import { test, expect } from '@playwright/test';

test('로그인 → 대시보드 진입', async ({ page }) => {
  await page.goto('/login');

  // 이메일·비밀번호 입력
  await page.getByPlaceholder(/email|이메일/i).fill('test9@example.com');
  await page.getByPlaceholder(/password|비밀번호/i).fill('password9');

  // 로그인 버튼 클릭
  await page.getByRole('button', { name: /sign in|로그인/i }).click();

  // /dashboard 이동 확인
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  // 대시보드 핵심 요소 존재 확인 (탭 버튼)
  await expect(page.getByRole('button').first()).toBeVisible({ timeout: 10_000 });
});
