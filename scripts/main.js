import { system, world, EntityInitializationCause } from '@minecraft/server';
world.afterEvents.playerSpawn.subscribe((event)=>{
    var osd = event.player.onScreenDisplay;
    osd.setTitle("§l§6MIDAS TOUCH", {
        stayDuration: 20 * 5,
        fadeInDuration: 20,
        fadeOutDuration: 20,
        subtitle: "§cChallenge"
    });
});
var cancelNextSpawn = false;
world.beforeEvents.playerBreakBlock.subscribe((event)=>{
    system.run(()=>{
        var player = event.player;
        var dim = player.dimension;
        var block = event.block;
        var blockPos = block.location;
        var stack = event.itemStack;
        if (stack == null || stack == undefined) {
            event.cancel = true;
            cancelNextSpawn = true;
            dim.runCommand("setblock " + blockPos.x + " " + blockPos.y + " " + blockPos.z + " gold_block");
        }
    });
});
world.afterEvents.entitySpawn.subscribe((event)=>{
    system.run(()=>{
        if (event.cause == EntityInitializationCause.Spawned && cancelNextSpawn) {
            event.entity.kill();
            cancelNextSpawn = false;
        }
    });
});
var victory = false;
world.afterEvents.entityDie.subscribe((event)=>{
    system.run(()=>{
        console.warn("DEATH: " + event.deadEntity.typeId);
        if (event.deadEntity.typeId == "minecraft:ender_dragon") {
            victory = true;
            world.getAllPlayers().forEach((player)=>{
                var osd = player.onScreenDisplay;
                osd.setTitle("§l§6VICTORY", {
                    stayDuration: 20 * 5,
                    fadeInDuration: 20,
                    fadeOutDuration: 20,
                    subtitle: "§cChallenge Completed"
                });
            });
        }
    });
});
var timeLeft = 20 * 60 * 60; // One hour
function onTick() {
    world.getAllPlayers().forEach((player)=>{
        if (player == undefined || player == null) return;
        var dim = player.dimension;
        var osd = player.onScreenDisplay;
        if (victory) {
            osd.setActionBar("§aYou beat the challenge!");
            return;
        }
        var date = new Date(0);
        if (timeLeft > 0) {
            date.setSeconds(timeLeft / 20);
            osd.setActionBar("Time Remaining: " + date.toISOString().substring(11, 19));
        } else {
            osd.setActionBar("§cYou failed the challenge!");
            dim.runCommand("gamemode spectator \"" + player.name + "\"");
            return;
        }
        var pos = player.location;
        pos.y -= 1;
        if (dim == undefined || dim == null) return;
        var currentBlock = dim.getBlock(pos);
        if (currentBlock.isAir || currentBlock.isLiquid) return;
        dim.runCommand("setblock " + pos.x + " " + pos.y + " " + pos.z + " gold_block");
    });
    system.run(onTick);
    timeLeft--;
}
world.afterEvents.playerPlaceBlock.subscribe((event)=>{
    system.run(()=>{
        var block = event.block;
        if (!block.isAir && !block.isLiquid) {
            var dim = event.dimension;
            dim.runCommand("setblock " + block.x + " " + block.y + " " + block.z + " gold_block");
        }
    });
});
onTick();
