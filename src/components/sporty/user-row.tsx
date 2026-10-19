import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { useAccessToken } from "@/data/hooks";
import type { User } from "@/data/types";
import { isPhotonAsset } from "@/lib/auth/photon";

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Profilbildet fra tihlde.org, eller initialene hvis personen ikke har bilde (eller det feiler). */
export function UserAvatar({
  user,
  className,
}: {
  user: User;
  className?: string;
}) {
  return (
    <Avatar alt={user.name} className={className ?? "size-10"}>
      <AvatarFallback>
        <Text className="text-sm font-medium">{initials(user.name)}</Text>
      </AvatarFallback>
      {user.imageUrl && (
        <ProfileImage key={user.imageUrl} url={user.imageUrl} />
      )}
    </Avatar>
  );
}

/**
 * Lagt over initialene. Bilder lastet opp på tihlde.org er private og hentes med innloggingen, i en
 * mindre versjon (Photon lager den med `?w=`), så en liste ikke laster ned originalene.
 */
function ProfileImage({ url }: { url: string }) {
  const token = useAccessToken();
  const [failed, setFailed] = useState(false);
  const fromPhoton = isPhotonAsset(url);
  if (failed || (fromPhoton && !token.data)) return null;
  return (
    <Image
      source={
        fromPhoton
          ? {
              uri: `${url}${url.includes('?') ? '&' : '?'}w=320`,
              headers: { authorization: `Bearer ${token.data}` },
            }
          : { uri: url }
      }
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      transition={150}
      onError={() => setFailed(true)}
    />
  );
}

export function UserRow({
  user,
  subtitle,
  right,
}: {
  user: User;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <UserAvatar user={user} />
      <View className="flex-1">
        <Text className="font-medium">{user.name}</Text>
        {subtitle && (
          <Text className="text-muted-foreground text-sm">{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}
