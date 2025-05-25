# Disk Rebuild Checker

> **실시간 RAID/디스크 리빌드 및 상태 모니터링 대시보드**

## 소개

Disk Rebuild Checker는 데이터센터/서버 환경에서 여러 RAID 어레이와 디스크의 상태, 리빌드 진행률, 위험도, 장애 상황 등을 실시간으로 시각화하는 대시보드입니다. Next.js(App Router), TailwindCSS, shadcn/ui, Radix UI, next-themes 등 최신 프론트엔드 스택을 활용하여 실제 운영 환경에 바로 적용 가능한 수준의 완성도를 갖추고 있습니다.

## 주요 기능
- 다양한 RAID 타입(RAID 1, 5, 6, 10, JBOD 등) 지원
- 어레이별 리빌드 진행률, ETA, 속도, 위험도, 장애 상황 시각화
- 디스크별 상세 정보(온도, 벤더, 모델, 위치 등) 제공
- 상태/벤더/위치/서버타입별 필터링, 뷰 모드(그리드/테이블/컴팩트), 페이지네이션
- 자동 새로고침, 다크/라이트 테마 전환, 토스트 알림 등 실전 기능

## 기술 스택
- **Next.js** (App Router, TypeScript)
- **TailwindCSS** (커스텀 변수, 글로벌 스타일)
- **shadcn/ui, Radix UI** (재사용 가능한 UI 컴포넌트)
- **next-themes** (다크/라이트 테마)
- **React Hooks, Custom Hooks**

## 설치 및 실행
```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# (또는 npm/yarn 사용 가능)
```

개발 서버는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 주요 폴더 구조
```
├── app/                # Next.js App Router 엔트리, 페이지, 레이아웃, 글로벌 스타일
├── components/         # 재사용 가능한 UI 컴포넌트(shadcn/ui 기반)
├── hooks/              # 커스텀 React Hooks
├── lib/                # 유틸리티 함수
├── public/             # 정적 파일(이미지 등)
├── styles/             # 추가 글로벌 스타일
├── package.json        # 프로젝트 메타/의존성
├── tailwind.config.ts  # TailwindCSS 설정
└── tsconfig.json       # TypeScript 설정
```

## 기여 방법
1. 이슈/기능 제안 등록
2. 포크 후 브랜치 생성
3. PR(Pull Request) 제출

## 라이선스
MIT

---

> 본 프로젝트는 실제 데이터센터/서버 환경에서의 RAID/디스크 모니터링을 위한 프론트엔드 대시보드 예시입니다.

## 주요 컴포넌트/로직 설명
- **DiskRebuildChecker**: 대시보드 메인 컨테이너. RAID/디스크 어레이 상태, 리빌드 진행률, 위험도, 장애 상황 등 전체 UI/로직 총괄
- **ThemeToggle/ThemeStatus**: 다크/라이트 테마 전환 및 상태 표시
- **MultipleRebuildAlert/MultipleRebuildProgress/JBODStatus**: 어레이별 경고, 리빌드 진행률, JBOD 상태 등 시각화
- **refreshData**: 어레이 상태 새로고침(비동기, 예외 처리 포함)
- **getMultipleRebuildWarning/getArrayRiskLevel**: 어레이별 경고/위험도 평가 로직

## 상태 관리 흐름
- **useState/useEffect** 기반의 로컬 상태 관리
  - 어레이 목록, 필터, 뷰 모드, 새로고침 상태 등
- (필요시) 전역 상태 관리 도구 도입 가능 (예: context, recoil, zustand 등)

## 예외 처리 및 사용자 알림
- 비동기 데이터 갱신(refreshData) 등에서 try-catch로 예외 처리
- 오류 발생 시 콘솔 출력 및 **토스트 알림**(useToast 활용) 등 사용자 피드백 제공
- 네트워크/API 오류, 데이터 파싱 오류 등 다양한 예외 상황 대비 구조 설계 