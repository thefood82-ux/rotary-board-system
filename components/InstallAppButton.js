"use client";

import { useEffect, useState } from "react";

// 안드로이드 크롬은 beforeinstallprompt로 실제 설치 팝업을 띄울 수 있지만,
// iOS Safari는 애플 정책상 프로그램으로 설치를 띄울 수 없고(공유→홈 화면 추가만 가능),
// 카카오톡 인앱 브라우저는 애초에 설치 자체가 안 돼서 다른 브라우저로 먼저 열어야 한다.
// 그래서 안드로이드는 자동 설치, 그 외에는 상황에 맞는 안내창을 보여준다.
function detectEnv() {
  const ua = navigator.userAgent || "";
  const isKakao = /KAKAOTALK/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/i.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  return { isKakao, isIOS, isAndroid, isMobile: isIOS || isAndroid, isStandalone };
}

export default function InstallAppButton() {
  const [env, setEnv] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setEnv(detectEnv());

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  // 데스크톱이거나 이미 홈 화면 앱으로 실행 중이면 버튼을 아예 안 보여준다.
  if (!env || !env.isMobile || env.isStandalone) return null;

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowGuide(true);
  }

  return (
    <>
      <button type="button" className="install-app-btn" onClick={handleClick}>
        📲 홈 화면에 추가
      </button>

      {showGuide && (
        <div className="install-guide-backdrop" onClick={() => setShowGuide(false)}>
          <div className="install-guide-box" onClick={(e) => e.stopPropagation()}>
            <h3>홈 화면에 추가하는 방법</h3>
            {env.isKakao && (
              <p className="hint-warning">
                카카오톡 안에서는 설치할 수 없어요. 오른쪽 위(또는 아래) "···" 메뉴에서 "다른 브라우저로 열기"를
                눌러 {env.isIOS ? "Safari" : "Chrome"}로 연 다음 다시 시도해주세요.
              </p>
            )}
            {env.isIOS ? (
              <ol>
                <li>화면 하단 가운데 공유 버튼(⬆️)을 탭하세요</li>
                <li>아래로 스크롤해서 "홈 화면에 추가"를 탭하세요</li>
                <li>이름을 확인하고 오른쪽 위 "추가"를 탭하세요</li>
              </ol>
            ) : (
              <ol>
                <li>오른쪽 위 점 3개(⋮) 메뉴를 여세요</li>
                <li>"홈 화면에 추가" 또는 "앱 설치"를 탭하세요</li>
                <li>팝업에서 "설치"를 탭하세요</li>
              </ol>
            )}
            <button type="button" className="btn-secondary" onClick={() => setShowGuide(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
