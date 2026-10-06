import { alias, isExplosive, ShellType } from "@blitzkit/core";
import { literals } from "@blitzkit/i18n";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Flex,
  Heading,
  IconButton,
  Popover,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { SPALL_LINER_HE_DAMAGE_DELTA } from "../../../../../../core/blitzkit/spallLiner";
import { useLocale } from "../../../../../../hooks/useLocale";
import { useTankModelDefinition } from "../../../../../../hooks/useTankModelDefinition";
import { Duel } from "../../../../../../stores/duel";
import type { MaybeSkeletonComponentProps } from "../../../../../../types/maybeSkeletonComponentProps";
import { AssaultRangesVisualizer } from "./AssaultRangesVisualizer";
import { GunFlexibilityVisualizer } from "./GunFlexibilityVisualizer";
import { Info } from "./Info";
import { InfoWithDelta } from "./InfoWithDelta";
import { RELOAD_PRECISION, ReloadVisualizer } from "./ReloadVisualizer";
import { RicochetVisualizer } from "./RicochetVisualizer";
import { StatsTableWrapper } from "./StatsTableWrapper";
import type { StatsAcceptorProps } from "./TraverseVisualizer";

export function Firepower({
  stats,
  skeleton,
}: StatsAcceptorProps & MaybeSkeletonComponentProps) {
  const { strings, unwrap } = useLocale();
  const turret = Duel.use((state) => state.protagonist.turret);
  const gun = Duel.use((state) => state.protagonist.gun);
  const shell = Duel.use((state) => state.protagonist.shell);
  const tankModelDefinition = useTankModelDefinition();
  const turretModelDefinition = tankModelDefinition.turrets[turret.id];
  const gunModelDefinition = turretModelDefinition.guns[gun.id];
  const bestNonHeShell = gun.shells
    .filter(({ type }) => type !== ShellType.SHELL_TYPE_HE)
    .reduce<(typeof gun.shells)[number] | undefined>(
      (best, thisShell) =>
        best === undefined || thisShell.armor_damage > best.armor_damage
          ? thisShell
          : best,
      undefined,
    );
  const damagePerArmorDamage = stats.damage / shell.armor_damage;
  const spallLinerDamage = stats.damage * (1 + SPALL_LINER_HE_DAMAGE_DELTA);
  const bestNonHeDamage =
    bestNonHeShell && bestNonHeShell.armor_damage * damagePerArmorDamage;

  return (
    <StatsTableWrapper>
      <Flex align="center" gap="4">
        <Heading size="5">
          {strings.website.tools.tankopedia.firepower.title}
        </Heading>

        <Flex>
          {gun.shells.map((thisShell, shellIndex) => {
            const selected = thisShell.id === shell.id;

            return (
              <Tooltip content={unwrap(thisShell.name!)} key={thisShell.id}>
                <IconButton
                  color={selected ? undefined : "gray"}
                  variant={selected ? "solid" : "soft"}
                  highContrast={selected}
                  style={{
                    borderTopLeftRadius: shellIndex === 0 ? undefined : 0,
                    borderBottomLeftRadius: shellIndex === 0 ? undefined : 0,
                    borderTopRightRadius:
                      shellIndex === gun.shells.length - 1 ? undefined : 0,
                    borderBottomRightRadius:
                      shellIndex === gun.shells.length - 1 ? undefined : 0,
                    marginLeft: shellIndex === 0 ? 0 : -1,
                  }}
                  onClick={() => {
                    Duel.mutate((draft) => {
                      draft.protagonist.shell = thisShell;
                    });
                  }}
                >
                  <img
                    alt={unwrap(thisShell.name!)}
                    width={16}
                    height={16}
                    src={alias("api", `/icons/shells/${thisShell.icon}.webp`)}
                  />
                </IconButton>
              </Tooltip>
            );
          })}
        </Flex>
      </Flex>

      <Info
        name={strings.website.tools.tankopedia.characteristics.values.gunType}
      >
        {strings.common.gun_types[gun.gun_type!.$case]}
      </Info>
      <InfoWithDelta stats={stats} decimals={0} value="dpm" />
      {gun.gun_type!.$case === "regular" && (
        <InfoWithDelta
          stats={stats}
          indent
          decimals={0}
          noRanking
          name={
            <Flex align="center" gap="1" display="inline-flex">
              {
                strings.website.tools.tankopedia.characteristics.values
                  .peekabooDpm
              }

              <Popover.Root>
                <Popover.Trigger>
                  <IconButton variant="ghost" size="1">
                    <InfoCircledIcon />
                  </IconButton>
                </Popover.Trigger>

                <Popover.Content style={{ maxWidth: 280 }}>
                  <Text size="2">
                    {
                      strings.website.tools.tankopedia.characteristics.values
                        .peekabooDpmInfo
                    }
                  </Text>
                </Popover.Content>
              </Popover.Root>
            </Flex>
          }
          value={(tank) => tank.peekabooDpm}
        />
      )}
      <InfoWithDelta stats={stats} decimals={0} value="damage" />
      {shell.type === ShellType.SHELL_TYPE_HE &&
        bestNonHeShell !== undefined &&
        bestNonHeDamage !== undefined && (
          <Info
            indent
            name={
              <Flex align="center" gap="1" display="inline-flex">
                {spallLinerDamage > bestNonHeDamage
                  ? strings.website.tools.tankopedia.firepower
                      .spall_liner_shoot
                  : strings.website.tools.tankopedia.firepower
                      .spall_liner_dont_shoot}

                <Popover.Root>
                  <Popover.Trigger>
                    <IconButton variant="ghost" size="1">
                      <InfoCircledIcon />
                    </IconButton>
                  </Popover.Trigger>

                  <Popover.Content style={{ maxWidth: 280 }}>
                    <Flex direction="column" gap="1">
                      <Text size="2">
                        {literals(
                          strings.website.tools.tankopedia.firepower
                            .spall_liner_he,
                          {
                            damage: Math.round(stats.damage),
                            percent: Math.abs(SPALL_LINER_HE_DAMAGE_DELTA * 100),
                            reduced: Math.round(spallLinerDamage),
                          },
                        )}
                      </Text>
                      <Text size="2">
                        {literals(
                          strings.website.tools.tankopedia.firepower
                            .spall_liner_best,
                          {
                            reduced: Math.round(spallLinerDamage),
                            comparison:
                              spallLinerDamage > bestNonHeDamage
                                ? ">"
                                : spallLinerDamage === bestNonHeDamage
                                  ? "="
                                  : "<",
                            damage: Math.round(bestNonHeDamage),
                          },
                        )}
                      </Text>
                    </Flex>
                  </Popover.Content>
                </Popover.Root>
              </Flex>
            }
          />
        )}
      {gun.gun_type!.$case !== "regular" && (
        <InfoWithDelta stats={stats} indent decimals={0} value="clipDamage" />
      )}
      <InfoWithDelta stats={stats} decimals={0} value="moduleDamage" />
      <InfoWithDelta stats={stats} decimals={0} value="penetration" />

      {gun.assault_ranges?.types.includes(shell.type) && (
        <AssaultRangesVisualizer stats={stats} ranges={gun.assault_ranges} />
      )}

      {gun.gun_type!.$case === "auto_reloader" && (
        <InfoWithDelta stats={stats} decimals={0} indent value="dpmEffective" />
      )}
      {gun.gun_type!.$case !== "regular" && (
        <InfoWithDelta stats={stats} value="shells" />
      )}
      {gun.gun_type!.$case === "auto_reloader" ? (
        <>
          <Info
            indent
            name={
              strings.website.tools.tankopedia.characteristics.values
                .mostOptimalShellIndex
            }
          >
            {stats.mostOptimalShellIndex! + 1}
          </Info>
          <Info
            name={
              strings.website.tools.tankopedia.characteristics.values
                .shellReloads
            }
          />
          {stats.shellReloads!.map((reload, index) => (
            <InfoWithDelta
              stats={stats}
              key={index}
              indent
              name={literals(
                strings.website.tools.tankopedia.characteristics.values
                  .shell_index,
                { index: index + 1 },
              )}
              decimals={RELOAD_PRECISION}
              deltaType="lowerIsBetter"
              noRanking
              value={() => reload}
            />
          ))}
        </>
      ) : (
        <InfoWithDelta
          stats={stats}
          decimals={RELOAD_PRECISION}
          deltaType="lowerIsBetter"
          value="shellReload"
        />
      )}
      {(gun.gun_type!.$case === "auto_loader" ||
        gun.gun_type!.$case === "auto_reloader") && (
        <InfoWithDelta
          stats={stats}
          indent
          decimals={RELOAD_PRECISION}
          deltaType="lowerIsBetter"
          value="intraClip"
        />
      )}
      <ReloadVisualizer stats={stats} />

      {isExplosive(shell.type) && (
        <InfoWithDelta
          stats={stats}
          noRanking
          decimals={0}
          value="explosionRadius"
        />
      )}
      <InfoWithDelta stats={stats} decimals={0} value="caliber" />

      {!isExplosive(shell.type) && (
        <>
          <InfoWithDelta
            stats={stats}
            decimals={0}
            noRanking
            value="shellNormalization"
          />
          <InfoWithDelta
            stats={stats}
            noRanking
            decimals={0}
            deltaType="lowerIsBetter"
            value="shellRicochet"
          />
        </>
      )}

      <RicochetVisualizer stats={stats} />

      <InfoWithDelta stats={stats} decimals={0} value="shellVelocity" />
      <InfoWithDelta stats={stats} decimals={0} value="shellRange" />
      <InfoWithDelta stats={stats} decimals={0} value="shellCapacity" />
      <InfoWithDelta
        stats={stats}
        decimals={2}
        deltaType="lowerIsBetter"
        value="aimTime"
      />
      <Info
        name={literals(
          strings.website.tools.tankopedia.characteristics.values
            .dispersion_at_distance,
          { distance: 100 },
        )}
      />
      <InfoWithDelta
        stats={stats}
        decimals={3}
        indent
        deltaType="lowerIsBetter"
        value="dispersion"
      />
      <InfoWithDelta
        stats={stats}
        prefix="+"
        decimals={3}
        indent
        deltaType="lowerIsBetter"
        value="dispersionMoving"
      />
      <InfoWithDelta
        stats={stats}
        decimals={3}
        prefix="+"
        indent
        deltaType="lowerIsBetter"
        value="dispersionHullTraversing"
      />
      <InfoWithDelta
        stats={stats}
        decimals={3}
        prefix="+"
        indent
        deltaType="lowerIsBetter"
        value="dispersionTurretTraversing"
      />
      <InfoWithDelta
        stats={stats}
        decimals={3}
        prefix="+"
        indent
        deltaType="lowerIsBetter"
        value="dispersionShooting"
      />
      <InfoWithDelta
        stats={stats}
        decimals={1}
        prefix="x"
        indent
        deltaType="lowerIsBetter"
        value="dispersionGunDamaged"
      />
      <Info
        name={
          strings.website.tools.tankopedia.characteristics.values
            .gun_flexibility
        }
      />
      <InfoWithDelta value="gunDepression" stats={stats} decimals={1} indent />
      <InfoWithDelta stats={stats} decimals={1} indent value="gunElevation" />
      {gunModelDefinition.pitch!.front && (
        <>
          <InfoWithDelta
            stats={stats}
            decimals={1}
            indent
            value="gunFrontalDepression"
          />
          <InfoWithDelta
            stats={stats}
            decimals={1}
            indent
            value="gunFrontalElevation"
          />
        </>
      )}
      {gunModelDefinition.pitch!.back && (
        <>
          <InfoWithDelta
            stats={stats}
            decimals={1}
            indent
            value="gunRearDepression"
          />
          <InfoWithDelta
            stats={stats}
            decimals={1}
            indent
            value="gunRearElevation"
          />
        </>
      )}
      {turretModelDefinition.yaw && (
        <>
          <InfoWithDelta
            stats={stats}
            decimals={1}
            indent
            value="azimuthLeft"
          />
          <InfoWithDelta
            stats={stats}
            decimals={1}
            indent
            value="azimuthRight"
          />
        </>
      )}
      <GunFlexibilityVisualizer skeleton={skeleton} />
    </StatsTableWrapper>
  );
}
