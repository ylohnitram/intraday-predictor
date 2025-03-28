"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsContent() {
  const [savingSettings, setSavingSettings] = useState(false)
  const { toast } = useToast()

  const handleSaveSettings = () => {
    setSavingSettings(true)

    // Simulate saving settings
    setTimeout(() => {
      setSavingSettings(false)
      toast({
        title: "Settings saved",
        description: "Your notification settings have been saved successfully.",
        duration: 3000,
      })
    }, 1500)
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure notification settings</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={savingSettings}>
          {savingSettings ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how and when you receive trading notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notificationChannels">Notification Channels</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="emailNotifications" defaultChecked />
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="browserNotifications" defaultChecked />
                  <Label htmlFor="browserNotifications">Browser notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="telegramNotifications" />
                  <Label htmlFor="telegramNotifications">Telegram notifications</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input id="emailAddress" type="email" placeholder="Enter your email address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
              <Input id="telegramBotToken" type="password" placeholder="Enter your Telegram bot token" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
              <Input id="telegramChatId" placeholder="Enter your Telegram chat ID" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationEvents">Notification Events</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="signalNotifications" defaultChecked />
                  <Label htmlFor="signalNotifications">New trading signals</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="priceAlerts" defaultChecked />
                  <Label htmlFor="priceAlerts">Price alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="patternDetection" defaultChecked />
                  <Label htmlFor="patternDetection">Pattern detection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sundayMondayAlerts" defaultChecked />
                  <Label htmlFor="sundayMondayAlerts">Sunday-Monday transition alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="gapAlerts" defaultChecked />
                  <Label htmlFor="gapAlerts">CME gap alerts</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => {
                toast({
                  title: "Test notification sent",
                  description: "A test notification has been sent to your configured channels.",
                  duration: 3000,
                })
              }}
            >
              Test Notifications
            </Button>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

