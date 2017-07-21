# coding=utf-8
import configparser
import logging
import time

import osu_ds
from discord import Message, Embed, Colour, errors

from data.stats import MESSAGE
from data.utils import is_valid_command, invert_num, invert_str, split_every

# osu! plugin for Nano

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

parser = configparser.ConfigParser()
parser.read("plugins/config.ini")

commands = {
    "_osu": {"desc": "Displays stats for that osu! user.", "use": "[command] [username/id]", "alias": None},
}

valid_commands = commands.keys()


class Osu:
    def __init__(self, **kwargs):
        self.nano = kwargs.get("nano")
        self.client = kwargs.get("client")
        self.stats = kwargs.get("stats")
        self.trans = kwargs.get("trans")

        try:
            key = parser.get("osu", "api-key")
            self.osu = osu_ds.OsuApi(api_key=key)
        except (configparser.NoSectionError, configparser.NoOptionError):
            logger.critical("Missing api key for osu!, disabling plugin...")
            raise RuntimeError

    async def on_message(self, message, **kwargs):
        assert isinstance(message, Message)
        client = self.client
        trans = self.trans

        prefix = kwargs.get("prefix")
        lang = kwargs.get("lang")

        if not is_valid_command(message.content, valid_commands, prefix=prefix):
            return
        else:
            self.stats.add(MESSAGE)

        def startswith(*args):
            for a in args:
                if message.content.startswith(a):
                    return True

            return False

        if startswith(prefix + "osu"):
            username = message.content[len(prefix + "osu "):]

            t_start = time.time()

            user = self.osu.get_user(username)

            if not user:
                await client.send_message(message.channel, trans.get("ERROR_NO_USER2", lang))
                return

            # About inverting: this inverts the number before and after the splitting
            def prepare(this):
                if not type(this) in (float, int):
                    return None

                return invert_str(",".join(split_every(str(invert_num(this)), 3)))

            global_rank = prepare(user.world_rank)
            country_rank = prepare(user.country_rank)

            total_score = prepare(user.total_score)
            ranked_score = prepare(user.ranked_score)

            try:
                acc = str(round(float(user.accuracy), 2)) + " %"
            except TypeError:
                acc = trans.get("INFO_ERROR", lang)

            pp_amount = str(int(float(user.pp)))

            osu_level = int(float(user.level))
            avatar_url = "http://a.ppy.sh/{}".format(user.id)

            # Color is determined by the level range
            if osu_level < 10:
                color = Colour.darker_grey()
            elif osu_level < 25:
                color = Colour.light_grey()
            elif osu_level < 40:
                color = Colour.dark_teal()
            elif osu_level < 50:
                color = Colour.teal()
            elif osu_level < 75:
                color = Colour.dark_purple()
            elif osu_level < 100:
                color = Colour.purple()
            # Only the masters get the gold ;)
            else:
                color = Colour.gold()

            desc = trans.get("MSG_OSU_DESC", lang).format(osu_level, global_rank, user.country, country_rank, pp_amount)

            embed = Embed(url=user.profile_url, description=desc, colour=color)
            embed.set_author(name=user.name)
            embed.set_thumbnail(url=avatar_url)

            embed.add_field(name=trans.get("MSG_OSU_TOTAL_SC", lang), value=total_score)
            embed.add_field(name=trans.get("MSG_OSU_RANKED_SC", lang), value=ranked_score)
            embed.add_field(name=trans.get("MSG_OSU_AVG_ACC", lang), value=acc)

            delta = int((time.time() - t_start) * 1000)
            embed.set_footer(text=trans.get("MSG_OSU_TIME", lang).format(delta))

            try:
                await client.send_message(message.channel, embed=embed)
            except errors.HTTPException:
                await client.send_message(message.channel, trans.get("MSG_OSU_ERROR", lang))


class NanoPlugin:
    name = "osu!"
    version = "0.1.2"

    handler = Osu
    events = {
        "on_message": 10
        # type : importance
    }