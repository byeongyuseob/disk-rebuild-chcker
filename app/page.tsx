"use client"

import { useState, useEffect } from "react"
import {
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Moon,
  Sun,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Filter,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DiskArray {
  id: string
  name: string
  type: string
  status: "rebuilding" | "healthy" | "degraded" | "failed"
  rebuildProgress: number
  estimatedTimeRemaining: string
  speed: string
  location: {
    datacenter: string
    rack: string
    chassis: string
  }
  serverType: "NCP" | "SEG"
  serverModel: string
  serverVendor: string
  disks: {
    id: string
    status: "healthy" | "rebuilding" | "failed"
    size: string
    temperature?: number
    serialNumber?: string
    vendor: string
    model: string
    location: {
      bay: number
      slot: string
    }
    classification: string
  }[]
}

/**
 * 테마(다크/라이트) 전환 버튼 컴포넌트
 * @returns {JSX.Element}
 */
function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isChangingTheme, setIsChangingTheme] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = async () => {
    setIsChangingTheme(true)
    const newTheme = theme === "light" ? "dark" : "light"

    try {
      // Save to localStorage explicitly for backup
      localStorage.setItem("disk-monitor-theme", newTheme)
      localStorage.setItem("disk-monitor-theme-timestamp", Date.now().toString())

      setTheme(newTheme)

      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 150))
    } catch (error) {
      console.warn("Failed to save theme preference:", error)
    } finally {
      setIsChangingTheme(false)
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div className="w-10 h-10" /> // Placeholder to prevent layout shift
  }

  const currentTheme = theme === "system" ? systemTheme : theme

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeChange}
      disabled={isChangingTheme}
      title={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          isChangingTheme ? "scale-110" : "rotate-0 scale-100"
        } dark:-rotate-90 dark:scale-0`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          isChangingTheme ? "scale-110" : "rotate-90 scale-0"
        } dark:rotate-0 dark:scale-100`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

/**
 * 현재 테마 상태 및 저장 정보 표시 컴포넌트
 * @returns {JSX.Element}
 */
function ThemeStatus() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{
    saved: boolean
    timestamp: string | null
  }>({ saved: false, timestamp: null })

  useEffect(() => {
    setMounted(true)

    // Check localStorage for theme persistence info
    try {
      const savedTheme = localStorage.getItem("disk-monitor-theme")
      const timestamp = localStorage.getItem("disk-monitor-theme-timestamp")

      setStorageInfo({
        saved: !!savedTheme,
        timestamp: timestamp ? new Date(Number.parseInt(timestamp)).toLocaleString() : null,
      })
    } catch (error) {
      console.warn("Failed to read theme storage info:", error)
    }
  }, [theme])

  if (!mounted) return null

  const currentTheme = theme === "system" ? systemTheme : theme

  return (
    <div className="text-xs text-muted-foreground flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${currentTheme === "dark" ? "bg-slate-600" : "bg-yellow-400"}`} />
      <span>
        {currentTheme === "dark" ? "Dark" : "Light"} mode
        {storageInfo.saved && storageInfo.timestamp && (
          <span className="ml-1 opacity-75">(saved {new Date(storageInfo.timestamp).toLocaleTimeString()})</span>
        )}
      </span>
    </div>
  )
}

function LocationInfo({ location }: { location: DiskArray["location"] }) {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">DC:</span>
        <span className="font-medium">{location.datacenter}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-muted-foreground">Rack:</span>
        <span className="font-medium">{location.rack}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-muted-foreground">Chassis:</span>
        <span className="font-medium">{location.chassis}</span>
      </div>
    </div>
  )
}

function ServerTypeInfo({
  serverType,
  serverModel,
  serverVendor,
}: { serverType: string; serverModel: string; serverVendor: string }) {
  const serverTypeColors = {
    NCP: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
    SEG: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800",
  }

  const serverTypeDescriptions = {
    NCP: "Network Control Protocol Server",
    SEG: "Segment Storage Server",
  }

  return (
    <div className={`p-3 rounded-lg border ${serverTypeColors[serverType as keyof typeof serverTypeColors]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5" />
          <div>
            <div className="font-medium">
              {serverType} Server - {serverModel}
            </div>
            <div className="text-sm opacity-90">
              {serverTypeDescriptions[serverType as keyof typeof serverTypeDescriptions]}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="font-medium">
          {serverVendor}
        </Badge>
      </div>
    </div>
  )
}

function DiskStatusSummary({ disks }: { disks: DiskArray["disks"] }) {
  const healthy = disks.filter((d) => d.status === "healthy").length
  const rebuilding = disks.filter((d) => d.status === "rebuilding").length
  const failed = disks.filter((d) => d.status === "failed").length

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>{healthy} Healthy</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full" />
        <span>{rebuilding} Rebuilding</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span>{failed} Failed</span>
      </div>
    </div>
  )
}

function CompactDiskView({ disk }: { disk: DiskArray["disks"][0] }) {
  const statusColors = {
    healthy: "bg-green-500",
    rebuilding: "bg-blue-500",
    failed: "bg-red-500",
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[disk.status]}`} />
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{disk.id}</span>
            <Badge variant="outline" className="text-xs">
              {disk.vendor}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {disk.size} • Bay {disk.location.bay} • {disk.location.slot}
          </div>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {disk.status}
      </Badge>
    </div>
  )
}

function TableDiskView({ disks }: { disks: DiskArray["disks"] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b">
        <div className="grid grid-cols-7 gap-4 text-sm font-medium">
          <span>Disk ID</span>
          <span>Vendor</span>
          <span>Model</span>
          <span>Size</span>
          <span>Location</span>
          <span>Status</span>
          <span>Temperature</span>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {disks.map((disk) => (
          <div key={disk.id} className="px-4 py-2 border-b last:border-b-0 hover:bg-muted/30">
            <div className="grid grid-cols-7 gap-4 text-sm items-center">
              <div className="flex items-center space-x-2">
                <HardDrive
                  className={`w-4 h-4 ${
                    disk.status === "healthy"
                      ? "text-green-500"
                      : disk.status === "rebuilding"
                        ? "text-blue-500"
                        : "text-red-500"
                  }`}
                />
                <span className="font-medium">{disk.id}</span>
              </div>
              <Badge variant="outline" className="w-fit">
                {disk.vendor}
              </Badge>
              <span className="text-muted-foreground">{disk.model}</span>
              <span>{disk.size}</span>
              <span className="text-muted-foreground">
                Bay {disk.location.bay} • {disk.location.slot}
              </span>
              <Badge variant="outline" className="w-fit">
                {disk.status}
              </Badge>
              <span className="text-muted-foreground">{disk.temperature ? `${disk.temperature}°C` : "N/A"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MultipleRebuildAlert({ array }: { array: DiskArray }) {
  const warning = getMultipleRebuildWarning(array)
  const riskLevel = getArrayRiskLevel(array)

  if (!warning && riskLevel === "low") return null

  const alertVariant = warning?.level === "error" ? "destructive" : "default"
  const riskColor =
    riskLevel === "critical" ? "text-red-600" : riskLevel === "high" ? "text-orange-600" : "text-yellow-600"

  return (
    <Alert variant={alertVariant} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          {warning && (
            <div>
              <div className="font-medium">{warning.message}</div>
              <div className="text-sm opacity-90">{warning.action}</div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-sm">Risk Level:</span>
            <Badge variant="outline" className={riskColor}>
              {riskLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

function MultipleRebuildProgress({ array }: { array: DiskArray }) {
  const rebuildingDisks = array.disks.filter((d) => d.status === "rebuilding")

  if (rebuildingDisks.length === 0 || array.type === "JBOD") return null

  if (rebuildingDisks.length === 1) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Rebuild Progress ({rebuildingDisks[0].id})</span>
          <span className="font-medium">{array.rebuildProgress}%</span>
        </div>
        <Progress value={array.rebuildProgress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>ETA: {array.estimatedTimeRemaining}</span>
          </div>
          <span>Speed: {array.speed}</span>
        </div>
      </div>
    )
  }

  // Multiple rebuilding disks
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Multiple Rebuilds in Progress ({rebuildingDisks.length} disks)</div>
      {rebuildingDisks.map((disk, index) => {
        // Simulate different progress for each disk
        const diskProgress = Math.max(0, array.rebuildProgress - index * 15)
        return (
          <div key={disk.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>
                {disk.id} ({disk.vendor})
              </span>
              <span className="font-medium">{diskProgress}%</span>
            </div>
            <Progress value={diskProgress} className="h-1.5" />
          </div>
        )
      })}
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>Overall ETA: {array.estimatedTimeRemaining}</span>
        </div>
        <span>Combined Speed: {array.speed}</span>
      </div>
    </div>
  )
}

function JBODStatus({ array }: { array: DiskArray }) {
  if (array.type !== "JBOD") return null

  const failedDisks = array.disks.filter((d) => d.status === "failed")
  const healthyDisks = array.disks.filter((d) => d.status === "healthy")

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-2">
          <HardDrive className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-blue-800 dark:text-blue-200">JBOD Configuration</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Individual disks with no redundancy. Each disk failure results in data loss for that disk only.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Total Capacity</div>
          <div className="font-semibold">{array.disks.length * Number.parseInt(array.disks[0]?.size || "0")}TB</div>
        </div>
        <div>
          <div className="text-muted-foreground">Available Capacity</div>
          <div className="font-semibold">{healthyDisks.length * Number.parseInt(array.disks[0]?.size || "0")}TB</div>
        </div>
        <div>
          <div className="text-muted-foreground">Lost Capacity</div>
          <div className="font-semibold text-red-600">
            {failedDisks.length * Number.parseInt(array.disks[0]?.size || "0")}TB
          </div>
        </div>
      </div>

      {failedDisks.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-800 dark:text-red-200">Data Loss Alert</div>
              <div className="text-sm text-red-700 dark:text-red-300">
                {failedDisks.length} disk(s) failed. Data on these disks is permanently lost. Failed disks:{" "}
                {failedDisks.map((d) => d.id).join(", ")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 어레이의 복수 리빌드/장애 상황에 대한 경고 메시지 및 액션 반환
 * @param {DiskArray} array
 * @returns {object|null} 경고 메시지/액션 또는 null
 */
function getMultipleRebuildWarning(array: DiskArray) {
  const rebuildingCount = array.disks.filter((d) => d.status === "rebuilding").length
  const failedCount = array.disks.filter((d) => d.status === "failed").length

  if (array.type === "JBOD") {
    if (failedCount > 0) {
      return {
        level: "error" as const,
        message: `${failedCount} disk(s) failed. No redundancy - data loss occurred.`,
        action: "Immediate replacement required",
      }
    }
    return null
  }

  if (rebuildingCount > 1) {
    return {
      level: "warning" as const,
      message: `${rebuildingCount} disks rebuilding simultaneously. Performance impact expected.`,
      action: "Monitor closely and avoid additional load",
    }
  }

  if (array.type === "RAID 5" && failedCount > 0 && rebuildingCount > 0) {
    return {
      level: "error" as const,
      message: "RAID 5 with failed disk during rebuild - critical risk of data loss!",
      action: "Stop all non-essential operations immediately",
    }
  }

  return null
}

/**
 * 어레이의 위험도(critical/high/medium/low) 평가
 * @param {DiskArray} array
 * @returns {string} 위험도 레벨
 */
function getArrayRiskLevel(array: DiskArray) {
  const rebuildingCount = array.disks.filter((d) => d.status === "rebuilding").length
  const failedCount = array.disks.filter((d) => d.status === "failed").length

  if (array.type === "JBOD") {
    return failedCount > 0 ? "high" : "low"
  }

  // RAID risk assessment
  if (array.type === "RAID 1") {
    return rebuildingCount > 0 || failedCount > 0 ? "high" : "low"
  } else if (array.type === "RAID 5") {
    if (failedCount > 1 || (failedCount === 1 && rebuildingCount > 0)) return "critical"
    if (rebuildingCount > 1 || failedCount === 1) return "high"
    return rebuildingCount > 0 ? "medium" : "low"
  } else if (array.type === "RAID 6") {
    if (failedCount > 2 || (failedCount === 2 && rebuildingCount > 0)) return "critical"
    if (rebuildingCount > 2 || failedCount === 2) return "high"
    return rebuildingCount > 0 || failedCount > 0 ? "medium" : "low"
  } else if (array.type === "RAID 10") {
    // Simplified RAID 10 risk assessment
    if (rebuildingCount > 2 || failedCount > 1) return "high"
    return rebuildingCount > 0 || failedCount > 0 ? "medium" : "low"
  }

  return "low"
}

/**
 * 대시보드 메인 컴포넌트. 여러 RAID/디스크 어레이의 상태, 리빌드 진행률, 위험도, 장애 상황 등을 시각화한다.
 * - 필터, 뷰 모드, 자동 새로고침, 테마 전환 등 대시보드 핵심 기능 구현
 * - 상태 관리: useState, useEffect
 * - 주요 하위 컴포넌트: ThemeToggle, ThemeStatus, MultipleRebuildAlert, MultipleRebuildProgress, JBODStatus 등
 */
export default function DiskRebuildChecker() {
  const [arrays, setArrays] = useState<DiskArray[]>([
    {
      id: "raid1-001",
      name: "RAID 1 Array",
      type: "RAID 1",
      status: "rebuilding",
      rebuildProgress: 67,
      estimatedTimeRemaining: "2h 15m",
      speed: "85 MB/s",
      location: {
        datacenter: "DC-East-01",
        rack: "R-15",
        chassis: "C-03",
      },
      serverType: "NCP",
      serverModel: "Dell PowerEdge R750",
      serverVendor: "Dell",
      disks: [
        {
          id: "sda",
          status: "healthy",
          size: "2TB",
          temperature: 42,
          vendor: "Samsung",
          model: "980 PRO",
          location: { bay: 1, slot: "A1" },
          classification: "Primary Storage",
        },
        {
          id: "sdb",
          status: "rebuilding",
          size: "2TB",
          temperature: 45,
          vendor: "Samsung",
          model: "980 PRO",
          location: { bay: 2, slot: "A2" },
          classification: "Primary Storage",
        },
      ],
    },
    {
      id: "raid6-large",
      name: "Large RAID 6 Storage Pool",
      type: "RAID 6",
      status: "rebuilding",
      rebuildProgress: 100,
      estimatedTimeRemaining: "0m",
      speed: "0 MB/s",
      location: {
        datacenter: "DC-West-02",
        rack: "R-08",
        chassis: "C-01",
      },
      serverType: "SEG",
      serverModel: "HPE ProLiant DL380",
      serverVendor: "HPE",
      disks: Array.from({ length: 48 }, (_, i) => ({
        id: `nvme${i}n1`,
        status: i === 23 ? "rebuilding" : i === 47 ? "rebuilding" : i === 12 ? "failed" : ("healthy" as const),
        size: "8TB",
        temperature: 35 + Math.floor(Math.random() * 15),
        serialNumber: `SN${String(i).padStart(3, "0")}ABC123`,
        vendor: i % 3 === 0 ? "Western Digital" : i % 3 === 1 ? "Seagate" : "Toshiba",
        model: i % 3 === 0 ? "WD Black SN850X" : i % 3 === 1 ? "FireCuda 530" : "XG8",
        location: { bay: i + 1, slot: `B${Math.floor(i / 12) + 1}` },
        classification: "Enterprise Storage",
      })),
    },
    {
      id: "raid10-003",
      name: "RAID 10 Performance",
      type: "RAID 10",
      status: "rebuilding",
      rebuildProgress: 23,
      estimatedTimeRemaining: "5h 42m",
      speed: "120 MB/s",
      location: {
        datacenter: "DC-Central-01",
        rack: "R-22",
        chassis: "C-05",
      },
      serverType: "NCP",
      serverModel: "Supermicro SYS-2029P",
      serverVendor: "Supermicro",
      disks: [
        {
          id: "sdg",
          status: "healthy",
          size: "1TB",
          temperature: 38,
          vendor: "Intel",
          model: "Optane P5800X",
          location: { bay: 1, slot: "C1" },
          classification: "High Performance",
        },
        {
          id: "sdh",
          status: "rebuilding",
          size: "1TB",
          temperature: 40,
          vendor: "Intel",
          model: "Optane P5800X",
          location: { bay: 2, slot: "C2" },
          classification: "High Performance",
        },
        {
          id: "sdi",
          status: "rebuilding",
          size: "1TB",
          temperature: 48,
          vendor: "Micron",
          model: "7450 PRO",
          location: { bay: 3, slot: "C3" },
          classification: "High Performance",
        },
        {
          id: "sdj",
          status: "healthy",
          size: "1TB",
          temperature: 39,
          vendor: "Micron",
          model: "7450 PRO",
          location: { bay: 4, slot: "C4" },
          classification: "High Performance",
        },
      ],
    },
    {
      id: "jbod-001",
      name: "JBOD Storage Pool",
      type: "JBOD",
      status: "degraded",
      rebuildProgress: 0,
      estimatedTimeRemaining: "N/A",
      speed: "N/A",
      location: {
        datacenter: "DC-South-01",
        rack: "R-05",
        chassis: "C-02",
      },
      serverType: "SEG",
      serverModel: "Lenovo ThinkSystem SR650",
      serverVendor: "Lenovo",
      disks: Array.from({ length: 24 }, (_, i) => ({
        id: `disk${i + 1}`,
        status: i === 5 ? "failed" : i === 12 ? "failed" : ("healthy" as const),
        size: "4TB",
        temperature: 30 + Math.floor(Math.random() * 20),
        serialNumber: `JBOD${String(i).padStart(3, "0")}XYZ`,
        vendor: i % 4 === 0 ? "HGST" : i % 4 === 1 ? "Western Digital" : i % 4 === 2 ? "Seagate" : "Toshiba",
        model: i % 4 === 0 ? "Ultrastar DC HC550" : i % 4 === 1 ? "WD Gold" : i % 4 === 2 ? "Exos X18" : "MG09ACA",
        location: { bay: i + 1, slot: `D${Math.floor(i / 6) + 1}` },
        classification: "Archive Storage",
      })),
    },
  ])

  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [diskViewMode, setDiskViewMode] = useState<"grid" | "compact" | "table">("grid")
  const [diskFilter, setDiskFilter] = useState<"all" | "healthy" | "rebuilding" | "failed">("all")
  const [serverTypeFilter, setServerTypeFilter] = useState<"all" | "NCP" | "SEG">("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [diskSearch, setDiskSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const disksPerPage = 20
  const { toast } = useToast();

  /**
   * 어레이 상태를 새로고침(리빌드 진행률, ETA 등 업데이트)
   * @async
   * @throws {Error} 네트워크/API 오류 발생 시
   */
  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate progress updates for rebuilding arrays
      setArrays((prev) =>
        prev.map((array) => {
          if (array.status === "rebuilding" && array.rebuildProgress < 100) {
            const newProgress = Math.min(array.rebuildProgress + Math.random() * 3, 100)
            const remainingHours = Math.max(0, (100 - newProgress) * 0.1)
            const hours = Math.floor(remainingHours)
            const minutes = Math.floor((remainingHours - hours) * 60)

            return {
              ...array,
              rebuildProgress: Math.round(newProgress),
              estimatedTimeRemaining: newProgress >= 100 ? "0m" : `${hours}h ${minutes}m`,
              status: newProgress >= 100 ? "healthy" : "rebuilding",
            }
          }
          return array
        }),
      )

      setLastUpdated(new Date())
    } catch (error) {
      toast({
        title: "데이터 새로고침 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
      console.error('데이터 새로고침 실패:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshData, 30000) // Auto-refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "rebuilding":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <HardDrive className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: "default",
      rebuilding: "secondary",
      degraded: "destructive",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const rebuildingArrays = arrays.filter((array) => array.status === "rebuilding")
  const healthyArrays = arrays.filter((array) => array.status === "healthy")
  const degradedArrays = arrays.filter((array) => array.status === "degraded" || array.status === "failed")

  // Get unique values for filters
  const uniqueLocations = Array.from(new Set(arrays.map((array) => array.location.datacenter)))
  const uniqueVendors = Array.from(new Set(arrays.flatMap((array) => array.disks.map((disk) => disk.vendor))))

  // Filter arrays based on selected filters
  const filteredArrays = arrays.filter((array) => {
    if (serverTypeFilter !== "all" && array.serverType !== serverTypeFilter) return false
    if (locationFilter !== "all" && array.location.datacenter !== locationFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disk Rebuild Monitor</h1>
            <div className="flex items-center space-x-4">
              <p className="text-muted-foreground">Monitor RAID array rebuild progress and disk health</p>
              <ThemeStatus />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Global Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Global Filters</span>
            </CardTitle>
            <CardDescription>Filter arrays by location, server type, and vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Location (Datacenter)</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Server Type</label>
                <Select value={serverTypeFilter} onValueChange={(value: any) => setServerTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Server Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Server Types</SelectItem>
                    <SelectItem value="NCP">NCP Servers</SelectItem>
                    <SelectItem value="SEG">SEG Servers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Vendor</label>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {uniqueVendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrays</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredArrays.length}</div>
              <div className="text-xs text-muted-foreground">
                {filteredArrays.length !== arrays.length && `(${arrays.length} total)`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rebuilding</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredArrays.filter((array) => array.status === "rebuilding").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredArrays.filter((array) => array.status === "healthy").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredArrays.filter((array) => array.status === "degraded" || array.status === "failed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Array Details */}
        <div className="space-y-4">
          {filteredArrays.map((array) => (
            <Card key={array.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(array.status)}
                    <div>
                      <CardTitle className="text-lg">{array.name}</CardTitle>
                      <CardDescription>
                        {array.type} • {array.id}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(array.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <MultipleRebuildAlert array={array} />

                {/* Location Information */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Location Information</span>
                  </h4>
                  <LocationInfo location={array.location} />
                </div>

                {/* Server Type Information */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                    <Server className="w-4 h-4" />
                    <span>Server Information</span>
                  </h4>
                  <ServerTypeInfo
                    serverType={array.serverType}
                    serverModel={array.serverModel}
                    serverVendor={array.serverVendor}
                  />
                </div>

                {array.type === "JBOD" ? (
                  <JBODStatus array={array} />
                ) : (
                  (array.status === "rebuilding" || array.disks.some((d) => d.status === "rebuilding")) && (
                    <MultipleRebuildProgress array={array} />
                  )
                )}

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Disk Status ({array.disks.length} disks)</h4>
                    <div className="flex items-center space-x-2">
                      {array.disks.length > 8 && (
                        <>
                          <ToggleGroup
                            type="single"
                            value={diskViewMode}
                            onValueChange={(value) => value && setDiskViewMode(value as any)}
                          >
                            <ToggleGroupItem value="grid" size="sm">
                              <Grid className="w-3 h-3" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="compact" size="sm">
                              <List className="w-3 h-3" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="table" size="sm">
                              <Server className="w-3 h-3" />
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </>
                      )}
                    </div>
                  </div>

                  <DiskStatusSummary disks={array.disks} />

                  {/* Vendor Summary */}

                  {(() => {
                    let filteredDisks = array.disks

                    if (diskFilter !== "all") {
                      filteredDisks = filteredDisks.filter((disk) => disk.status === diskFilter)
                    }

                    if (vendorFilter !== "all") {
                      filteredDisks = filteredDisks.filter((disk) => disk.vendor === vendorFilter)
                    }

                    if (diskSearch) {
                      filteredDisks = filteredDisks.filter((disk) =>
                        disk.id.toLowerCase().includes(diskSearch.toLowerCase()),
                      )
                    }

                    const totalPages = Math.ceil(filteredDisks.length / disksPerPage)
                    const paginatedDisks =
                      array.disks.length > disksPerPage
                        ? filteredDisks.slice(currentPage * disksPerPage, (currentPage + 1) * disksPerPage)
                        : filteredDisks

                    return (
                      <div className="mt-4 space-y-3">
                        {diskViewMode === "table" && array.disks.length > 8 ? (
                          <TableDiskView disks={paginatedDisks} />
                        ) : diskViewMode === "compact" && array.disks.length > 8 ? (
                          <div className="space-y-1">
                            {paginatedDisks.map((disk) => (
                              <CompactDiskView key={disk.id} disk={disk} />
                            ))}
                          </div>
                        ) : (
                          <div
                            className={`grid gap-3 ${
                              array.disks.length > 12
                                ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                                : "grid-cols-2 md:grid-cols-4"
                            }`}
                          >
                            {paginatedDisks.map((disk) => (
                              <div key={disk.id} className="flex flex-col space-y-2 p-3 border rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <HardDrive
                                    className={`w-4 h-4 ${
                                      disk.status === "healthy"
                                        ? "text-green-500"
                                        : disk.status === "rebuilding"
                                          ? "text-blue-500"
                                          : "text-red-500"
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">{disk.id}</div>
                                    <div className="text-xs text-muted-foreground">{disk.size}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {disk.status}
                                  </Badge>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <Badge variant="outline" className="text-blue-600">
                                      {disk.vendor}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      Bay {disk.location.bay} • {disk.location.slot}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{disk.model}</div>
                                  <div className="text-xs text-muted-foreground">{disk.classification}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {array.disks.length > disksPerPage && (
                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-muted-foreground">
                              Showing {currentPage * disksPerPage + 1}-
                              {Math.min((currentPage + 1) * disksPerPage, filteredDisks.length)} of{" "}
                              {filteredDisks.length} disks
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <span className="text-sm">
                                Page {currentPage + 1} of {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage >= totalPages - 1}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh every 30 seconds
        </div>
      </div>
    </div>
  )
}
